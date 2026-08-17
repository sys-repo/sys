import { HttpServer, Is, Random, Schedule, type t } from '../common.ts';
import { acceptsFetchSite, acceptsHost, exactAuthority } from '../../u.server.request.ts';
import { snapshotInput } from './u.input.ts';
import {
  forbiddenResponse,
  misdirectedResponse,
  type ResponseContext,
  statusResponse,
} from './u.response.ts';

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
  readonly finished: Promise<void>;
  readonly settled: boolean;
  readonly failed: boolean;
};

const START_ERRORS = new WeakSet<Error>();
const CAPABILITY_PATTERN = /^[0-9a-z]{48}$/;
const LIFECYCLE_ERROR_MESSAGE = 'BootstrapStatus listener lifecycle failed.';

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
  let observed: ListenerObservation | undefined;
  try {
    await Schedule.micro();

    const capability = deps.capability();
    if (!CAPABILITY_PATTERN.test(capability)) throw startError('failed');
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

    started = deps.startHttp(app, {
      hostname: '127.0.0.1',
      port: 0,
      origin: 'exact-loopback',
      silent: true,
      status: { kind: 'bootstrap-status' },
    });
    observed = observeListener(started);
    authority.host = new Set([exactAuthority(started)]);
    authority.response = Object.freeze({
      ...prepared,
      capabilityPath,
      origin: started.origin,
    });
    const url = `${started.origin}${capabilityPath}`;

    await settleListener(observed);
    return toPublicStarted(started, observed, url);
  } catch (cause) {
    if (started) {
      observed ??= observeListener(started);
      const closeFailed = requestLowerClose(started, 'bootstrap-status.start.failed');
      await proveFinished(started, observed, closeFailed);
    }
    if (isStartError(cause)) throw cause;
    throw startError('failed');
  }
}

async function settleListener(observed: ListenerObservation): Promise<void> {
  await Schedule.macro();
  if (observed.settled) throw startError('failed');
}

function toPublicStarted(
  started: t.HttpServer.Started,
  observed: ListenerObservation,
  url: t.StringUrl,
): t.BootstrapStatus.Started {
  let disposed = observed.settled;
  let closeCompletion: Promise<void> | undefined;
  void observed.finished.then(() => (disposed = true));

  const finished = observed.finished.then(() => {
    if (observed.failed) throw lifecycleError();
  });
  void finished.catch(() => undefined);

  const close = (reason?: unknown): Promise<void> => {
    if (closeCompletion) return closeCompletion;
    closeCompletion = closePublicStarted(started, observed, reason, () => (disposed = true));
    void closeCompletion.catch(() => undefined);
    return closeCompletion;
  };

  return Object.freeze({
    url,
    finished,
    get disposed() {
      return disposed;
    },
    close,
  });
}

async function closePublicStarted(
  started: t.HttpServer.Started,
  observed: ListenerObservation,
  reason: unknown,
  markDisposed: () => void,
): Promise<void> {
  const closeFailed = requestLowerClose(started, reason);
  await proveFinished(started, observed, closeFailed);
  markDisposed();
  if (await closeFailed || observed.failed) throw lifecycleError();
}

function requestLowerClose(started: t.HttpServer.Started, reason: unknown): Promise<boolean> {
  try {
    return Promise.resolve(started.close(reason)).then(
      () => false,
      () => true,
    );
  } catch {
    return Promise.resolve(true);
  }
}

async function proveFinished(
  started: t.HttpServer.Started,
  observed: ListenerObservation,
  closeFailed: Promise<boolean>,
): Promise<void> {
  await Promise.race([closeFailed, observed.finished, Schedule.micro()]);

  while (!observed.settled) {
    let shutdown: Promise<void>;
    try {
      shutdown = Promise.resolve(started.server.shutdown()).catch(() => undefined);
    } catch {
      shutdown = Promise.resolve();
    }
    await Promise.race([shutdown, observed.finished]);
    if (!observed.settled) await Schedule.macro();
  }

  await observed.finished;
}

function observeListener(started: t.HttpServer.Started): ListenerObservation {
  let settled = false;
  let failed = false;
  const finished = started.finished.then(
    () => {
      settled = true;
    },
    () => {
      failed = true;
      settled = true;
    },
  );
  return {
    finished,
    get settled() {
      return settled;
    },
    get failed() {
      return failed;
    },
  };
}

function lifecycleError(): Error {
  return new Error(LIFECYCLE_ERROR_MESSAGE);
}

function startError(reason: 'invalid input' | 'failed'): Error {
  const message = reason === 'failed'
    ? 'BootstrapStatus.start failed.'
    : 'BootstrapStatus.start invalid input.';
  const error = new Error(message);
  START_ERRORS.add(error);
  return error;
}

function isStartError(input: unknown): input is Error {
  return Is.error(input) && START_ERRORS.has(input);
}
