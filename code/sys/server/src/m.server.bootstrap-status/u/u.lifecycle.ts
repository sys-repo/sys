import type { t } from '../common.ts';
import { lifecycleError, startError } from './u.error.ts';
import {
  type ClosableLowerOwner,
  type CompleteLowerOwner,
  type ListenerObservation,
  type LowerOwner,
  observeListener,
  type ShutdownLowerOwner,
} from './u.listener.ts';
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

const RETAINED_LOWER_OWNERS = new Set<LowerOwner | t.HttpServer.Started>();
const RETAINED_LOWER_OPERATIONS = new Set<unknown>();
const apply = Reflect.apply;
const freeze = Object.freeze;

/** Reject startup when a listener terminates during its first captured scheduler turn. */
export async function settleListener(observed: ListenerObservation): Promise<void> {
  await macrotaskPromise();
  if (observed.settled) throw startError('failed');
}

/** Create the narrow public lifecycle facade for one complete lower listener. */
export function toPublicStarted(
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

/** Roll back one lower listener while retaining unproven authority for process lifetime. */
export async function rollbackLowerOwner(
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
    void requestLowerClose(owner as ClosableLowerOwner, 'bootstrap-status.start.failed');
  }
  if (listener?.settled) return;

  for (let attempt = 0; attempt < 4 && !listener?.settled; attempt += 1) {
    const shutdown = owner.shutdown && owner.server
      ? await rollbackShutdown(owner as ShutdownLowerOwner)
      : 'unavailable';
    if (!listener?.settled) await macrotaskPromise();
    if (!listener?.settled && shutdown !== 'rejected' && shutdown !== 'threw') break;
  }

  if (!listener?.settled) RETAINED_LOWER_OWNERS.add(owner);
}

/** Retain a lower listener whose authority could not be safely snapshotted. */
export function retainLowerStarted(started: t.HttpServer.Started): void {
  RETAINED_LOWER_OWNERS.add(started);
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

async function requestLowerClose(owner: ClosableLowerOwner, reason: unknown): Promise<boolean> {
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
  owner: ShutdownLowerOwner,
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

function ownRejection(promise: Promise<void>): void {
  observeExactPromise(promise, { fulfilled() {}, rejected() {} });
}
