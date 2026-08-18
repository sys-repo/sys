import { HttpServer, Is, Random, type t } from '../common.ts';
import { acceptsFetchSite, acceptsHost, exactAuthority } from '../../u.server.request.ts';
import { snapshotInput } from './u.input.ts';
import {
  forbiddenResponse,
  misdirectedResponse,
  type ResponseContext,
  statusResponse,
} from './u.response.ts';
import {
  createPromiseDeferred,
  firstSettlement,
  isExactNativePromise,
  isPromiseTransportReady,
  macrotaskPromise,
  microtaskPromise,
  observeExactPromise,
  promiseFailed,
} from './u.promise.ts';

export type StartDependencies = {
  readonly capability: () => string;
  readonly createApp: typeof HttpServer.create;
  readonly startHttp: typeof HttpServer.start;
};

export const DEFAULT_DEPENDENCIES: StartDependencies = Object.freeze({
  capability: () => Random.base36(48),
  createApp: HttpServer.create,
  startHttp: HttpServer.start,
});

type ListenerObservation = {
  readonly completion: Promise<void>;
  readonly finished: Promise<void>;
  readonly settled: boolean;
  readonly failed: boolean;
};

type LowerOwner = Readonly<{
  raw: t.HttpServer.Started;
  origin?: t.StringUrl;
  finished?: Promise<void>;
  close?: (reason?: unknown) => unknown;
  server?: Deno.HttpServer<Deno.NetAddr>;
  shutdown?: () => unknown;
}>;

type CompleteLowerOwner =
  & LowerOwner
  & Required<Pick<LowerOwner, 'origin' | 'finished' | 'close' | 'server' | 'shutdown'>>;

const START_ERRORS = new WeakSet<Error>();
const NativeError = Error;
const RETAINED_LOWER_OWNERS = new Set<LowerOwner | t.HttpServer.Started>();
const RETAINED_LOWER_OPERATIONS = new Set<unknown>();
const CAPABILITY_PATTERN = /^[0-9a-z]{48}$/;
const LIFECYCLE_ERROR_MESSAGE = 'BootstrapStatus listener lifecycle failed.';
const apply = Reflect.apply;
const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;

/** Start one launch-scoped inert bootstrap-status host. */
export const start: t.BootstrapStatus.Lib['start'] = (input) => startWith(input);

/** Internal deterministic startup seam. */
export async function startWith(
  input: unknown,
  deps: StartDependencies = DEFAULT_DEPENDENCIES,
): Promise<t.BootstrapStatus.Started> {
  const prepared = snapshotInput(input);
  if (!prepared) throw startError('invalid input');

  let started: t.HttpServer.Started | undefined;
  let owner: LowerOwner | undefined;
  let observed: ListenerObservation | undefined;
  try {
    await microtaskPromise();
    assertPromiseTransport();

    const capability = deps.capability();
    if (!Is.string(capability) || !CAPABILITY_PATTERN.test(capability)) throw startError('failed');
    const capabilityPath = `/${capability}`;
    const app = deps.createApp({ static: false, cors: false });
    const authority: {
      host?: ReadonlySet<string>;
      response?: ResponseContext;
    } = {};

    app.all('*', (context) => {
      const request = context.req.raw;
      if (!authority.host || !acceptsHost(request, authority.host)) {
        return misdirectedResponse(request);
      }
      if (!acceptsFetchSite(request)) return forbiddenResponse(request);
      return authority.response
        ? statusResponse(request, authority.response)
        : misdirectedResponse(request);
    });

    assertPromiseTransport();
    started = deps.startHttp(app, {
      hostname: '127.0.0.1',
      port: 0,
      origin: 'exact-loopback',
      silent: true,
      status: { kind: 'bootstrap-status' },
    });
    owner = snapshotLowerOwner(started);
    if (!isCompleteLowerOwner(owner)) throw startError('failed');
    observed = observeListener(owner.finished);
    assertPromiseTransport();

    authority.host = new Set([exactAuthority({ origin: owner.origin })]);
    authority.response = freeze({
      ...prepared,
      capabilityPath,
      origin: owner.origin,
    });
    const url = `${owner.origin}${capabilityPath}`;

    await settleListener(observed);
    assertPromiseTransport();
    return toPublicStarted(owner, observed, url);
  } catch (cause) {
    if (owner) await rollbackLowerOwner(owner, observed);
    else if (started) RETAINED_LOWER_OWNERS.add(started);
    if (isStartError(cause)) throw cause;
    throw startError('failed');
  }
}

async function settleListener(observed: ListenerObservation): Promise<void> {
  await macrotaskPromise();
  if (observed.settled) throw startError('failed');
}

function toPublicStarted(
  owner: CompleteLowerOwner,
  observed: ListenerObservation,
  url: t.StringUrl,
): t.BootstrapStatus.Started {
  let closeCompletion: Promise<void> | undefined;

  const close = (reason?: unknown): Promise<void> => {
    if (closeCompletion) return closeCompletion;
    const deferred = createPromiseDeferred<void>();
    closeCompletion = deferred.promise;
    ownRejection(closeCompletion);
    void settlePublicClose(owner, observed, reason, deferred);
    return closeCompletion;
  };
  const asyncDispose = (): Promise<void> => close();

  return freeze({
    url,
    finished: observed.finished,
    get disposed() {
      return observed.settled;
    },
    close,
    [Symbol.asyncDispose]: asyncDispose,
  });
}

async function settlePublicClose(
  owner: CompleteLowerOwner,
  observed: ListenerObservation,
  reason: unknown,
  deferred: ReturnType<typeof createPromiseDeferred<void>>,
): Promise<void> {
  try {
    await closePublicStarted(owner, observed, reason);
    deferred.resolve();
  } catch {
    deferred.reject(lifecycleError());
  }
}

async function closePublicStarted(
  owner: CompleteLowerOwner,
  observed: ListenerObservation,
  reason: unknown,
): Promise<void> {
  const closeFailed = requestLowerClose(owner, reason);
  await proveFinished(owner, observed, closeFailed);
  if (await closeFailed || observed.failed) throw lifecycleError();
}

async function requestLowerClose(owner: CompleteLowerOwner, reason: unknown): Promise<boolean> {
  try {
    return await promiseFailed(apply(owner.close, owner.raw, [reason]));
  } catch {
    return true;
  }
}

async function requestLowerShutdown(owner: CompleteLowerOwner): Promise<void> {
  try {
    await promiseFailed(apply(owner.shutdown, owner.server, []));
  } catch {
    // Listener settlement remains the authoritative absence proof.
  }
}

async function proveFinished(
  owner: CompleteLowerOwner,
  observed: ListenerObservation,
  closeFailed: Promise<boolean>,
): Promise<void> {
  await firstSettlement([closeFailed, observed.completion, microtaskPromise()]);

  while (!observed.settled) {
    const shutdown = requestLowerShutdown(owner);
    await firstSettlement([shutdown, observed.completion]);
    if (!observed.settled) await macrotaskPromise();
  }

  await observed.completion;
}

function observeListener(finished: Promise<void>): ListenerObservation {
  let settled = false;
  let failed = false;
  const completion = createPromiseDeferred<void>();
  const publicFinished = createPromiseDeferred<void>();
  ownRejection(completion.promise);
  ownRejection(publicFinished.promise);
  const admitted = observeExactPromise<void>(finished, {
    fulfilled() {
      settled = true;
      completion.resolve();
      publicFinished.resolve();
    },
    rejected() {
      failed = true;
      settled = true;
      const failure = lifecycleError();
      completion.reject(failure);
      publicFinished.reject(failure);
    },
  });
  if (!admitted) throw startError('failed');
  return {
    completion: completion.promise,
    finished: publicFinished.promise,
    get settled() {
      return settled;
    },
    get failed() {
      return failed;
    },
  };
}

async function rollbackLowerOwner(
  owner: LowerOwner,
  observed: ListenerObservation | undefined,
): Promise<void> {
  let listener = observed;
  if (!listener && owner.finished) {
    try {
      listener = observeListener(owner.finished);
    } catch {
      // Available direct shutdown authority remains independent of completion admission.
    }
  }

  if (!isPromiseTransportReady()) {
    retainUntilPromiseTransport(owner, listener);
    return;
  }

  if (owner.close) {
    void requestLowerClose(owner as CompleteLowerOwner, 'bootstrap-status.start.failed');
  }
  if (listener?.settled) return;

  for (let attempt = 0; attempt < 4 && !listener?.settled; attempt += 1) {
    const shutdown = owner.shutdown && owner.server
      ? await rollbackShutdown(owner as CompleteLowerOwner)
      : 'unavailable';
    if (!listener?.settled) await macrotaskPromise();
    if (!listener?.settled && shutdown !== 'rejected' && shutdown !== 'threw') break;
  }

  if (!listener?.settled) RETAINED_LOWER_OWNERS.add(owner);
}

function retainUntilPromiseTransport(
  owner: LowerOwner,
  observation: ListenerObservation | undefined,
): void {
  RETAINED_LOWER_OWNERS.add(owner);
  void resumeRollback(owner, observation);
}

async function resumeRollback(
  owner: LowerOwner,
  observation: ListenerObservation | undefined,
): Promise<void> {
  try {
    while (!isPromiseTransportReady()) await macrotaskPromise();
    await rollbackLowerOwner(owner, observation);
    if (observation?.settled) RETAINED_LOWER_OWNERS.delete(owner);
  } catch {
    // The retained owner remains the truthful process-lifetime fallback.
  }
}

async function rollbackShutdown(
  owner: CompleteLowerOwner,
): Promise<'fulfilled' | 'rejected' | 'unobservable' | 'threw'> {
  let transport: unknown;
  try {
    transport = apply(owner.shutdown, owner.server, []);
  } catch {
    return 'threw';
  }
  if (!isExactNativePromise(transport)) {
    RETAINED_LOWER_OPERATIONS.add(transport);
    return 'unobservable';
  }
  return await promiseFailed(transport) ? 'rejected' : 'fulfilled';
}

function snapshotLowerOwner(started: t.HttpServer.Started): LowerOwner {
  if (!Is.object(started) || Is.proxy(started)) return freeze({ raw: started });
  const origin = ownData(started, 'origin');
  const finished = ownData(started, 'finished');
  const close = ownData(started, 'close');
  const server = ownData(started, 'server');
  const shutdown = server.ok && Is.object(server.value) && !Is.proxy(server.value)
    ? dataMethod(server.value, 'shutdown')
    : undefined;
  return freeze({
    raw: started,
    ...(origin.ok && Is.string(origin.value) ? { origin: origin.value as t.StringUrl } : {}),
    ...(finished.ok && Is.nativePromise(finished.value)
      ? { finished: finished.value as Promise<void> }
      : {}),
    ...(close.ok && Is.func(close.value)
      ? { close: close.value as (reason?: unknown) => unknown }
      : {}),
    ...(server.ok && Is.object(server.value)
      ? { server: server.value as Deno.HttpServer<Deno.NetAddr> }
      : {}),
    ...(shutdown ? { shutdown } : {}),
  });
}

function isCompleteLowerOwner(owner: LowerOwner): owner is CompleteLowerOwner {
  return owner.origin !== undefined && owner.finished !== undefined && owner.close !== undefined &&
    owner.server !== undefined && owner.shutdown !== undefined;
}

function ownData(
  input: object,
  key: PropertyKey,
): Readonly<{ ok: true; value: unknown }> | Readonly<{ ok: false }> {
  try {
    const descriptor = getOwnPropertyDescriptor(input, key);
    return descriptor && 'value' in descriptor ? { ok: true, value: descriptor.value } : NOT_DATA;
  } catch {
    return NOT_DATA;
  }
}

function dataMethod(
  input: object,
  key: PropertyKey,
): ((...args: unknown[]) => unknown) | undefined {
  let target: object | null = input;
  for (let depth = 0; target && depth < 8; depth += 1) {
    const property = ownData(target, key);
    if (property.ok) {
      return Is.func(property.value)
        ? property.value as (...args: unknown[]) => unknown
        : undefined;
    }
    try {
      target = getPrototypeOf(target);
    } catch {
      return;
    }
  }
}

function ownRejection(promise: Promise<void>): void {
  observeExactPromise(promise, { fulfilled() {}, rejected() {} });
}

function assertPromiseTransport(): void {
  if (!isPromiseTransportReady()) throw startError('failed');
}

function lifecycleError(): Error {
  return new NativeError(LIFECYCLE_ERROR_MESSAGE);
}

function startError(reason: 'invalid input' | 'failed'): Error {
  const message = reason === 'failed'
    ? 'BootstrapStatus.start failed.'
    : 'BootstrapStatus.start invalid input.';
  const error = new NativeError(message);
  START_ERRORS.add(error);
  return error;
}

function isStartError(input: unknown): input is Error {
  return Is.error(input) && START_ERRORS.has(input);
}

const NOT_DATA = freeze({ ok: false as const });
