import { Is, type t } from '../common.ts';
import { lifecycleError, startError } from './u.error.ts';
import { createPromiseDeferred, observeExactPromise } from './u.promise.ts';

export type ListenerObservation = {
  readonly completion: Promise<void>;
  readonly finished: Promise<void>;
  readonly settled: boolean;
  readonly failed: boolean;
};

export type LowerOwner = Readonly<{
  raw: t.HttpServer.Started;
  origin?: t.StringUrl;
  finished?: Promise<void>;
  close?: (reason?: unknown) => unknown;
  server?: Deno.HttpServer<Deno.NetAddr>;
  shutdown?: () => unknown;
}>;

export type CompleteLowerOwner =
  & LowerOwner
  & Required<Pick<LowerOwner, 'origin' | 'finished' | 'close' | 'server' | 'shutdown'>>;

export type ClosableLowerOwner =
  & LowerOwner
  & Required<Pick<LowerOwner, 'close'>>;

export type ShutdownLowerOwner =
  & LowerOwner
  & Required<Pick<LowerOwner, 'server' | 'shutdown'>>;

const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const NOT_DATA = freeze({ ok: false as const });

/** Snapshot lower listener authority without invoking accessors or Proxy traps. */
export function snapshotLowerOwner(started: t.HttpServer.Started): LowerOwner {
  if (!Is.object(started) || Is.Native.proxy(started)) return freeze({ raw: started });
  const origin = ownData(started, 'origin');
  const finished = ownData(started, 'finished');
  const close = ownData(started, 'close');
  const server = ownData(started, 'server');
  const shutdown = server.ok && Is.object(server.value) && !Is.Native.proxy(server.value)
    ? dataMethod(server.value, 'shutdown')
    : undefined;
  return freeze({
    raw: started,
    ...(origin.ok && Is.string(origin.value) ? { origin: origin.value } : {}),
    ...(finished.ok && Is.Native.promise(finished.value)
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

/** Whether a listener snapshot contains every authority required by a public host. */
export function isCompleteLowerOwner(owner: LowerOwner): owner is CompleteLowerOwner {
  return owner.origin !== undefined && owner.finished !== undefined && owner.close !== undefined &&
    owner.server !== undefined && owner.shutdown !== undefined;
}

/** Observe lower completion through private and public exact-Promise channels. */
export function observeListener(finished: Promise<void>): ListenerObservation {
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
