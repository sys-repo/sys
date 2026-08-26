import { Is, Num, Schedule, type t } from './common.ts';
import { startError } from '../u.server/u.error.ts';
import { isExactNativePromise, isPromiseTransportReady, observeExactPromise } from './u.promise.ts';

/**
 * Observed settlement state for one admitted listener completion.
 */
export type ListenerObservation = Readonly<{
  settled: boolean;
  failed: boolean;
}>;

/**
 * Authority safely captured from one lower listener; absent fields were not admitted.
 */
export type ListenerOwner = Readonly<{
  raw: unknown;
  finished?: Promise<void>;
  close?: (reason?: unknown) => unknown;
  server?: Deno.HttpServer<Deno.NetAddr>;
  shutdown?: () => unknown;
  port?: t.PortNumber;
  origin?: t.StringUrl;
  hostname?: t.StringHostname;
  addrHostname?: string;
  signal?: AbortSignal;
}>;

/**
 * Listener snapshot containing every authority required by a public Dist host.
 */
export type CompleteListenerOwner =
  & ListenerOwner
  & Required<
    Pick<
      ListenerOwner,
      | 'finished'
      | 'close'
      | 'server'
      | 'shutdown'
      | 'port'
      | 'origin'
      | 'hostname'
      | 'addrHostname'
      | 'signal'
    >
  >;

type RetainedListenerOwner = Readonly<{
  owner: ListenerOwner;
  operations: readonly unknown[];
  observation?: ListenerObservation;
}>;

const apply = Reflect.apply;
const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const RETAINED_LISTENER_OWNERS = new Set<RetainedListenerOwner>();
const NativeAbortSignalPrototype = AbortSignal.prototype;
const NOT_DATA = freeze({ ok: false as const });

/**
 * Dispose one lifecycle only when the captured Promise substrate is safe to enter.
 *
 * If the substrate is temporarily unsafe, defer disposal until it recovers. Disposal remains
 * best-effort and never replaces the caller's primary failure.
 */
export function disposeLifeWhenReady(life: t.Abortable | undefined, reason?: unknown): void {
  if (!life) return;
  if (isPromiseTransportReady()) {
    try {
      life.dispose(reason);
    } catch {
      // The retaining caller preserves its fixed sanitized failure.
    }
    return;
  }
  void resumeLifeDisposal(life, reason);
}

/**
 * Capture one lower listener's lifecycle and shutdown authority from own data properties only.
 *
 * The snapshot never invokes caller-owned accessors or Proxy traps. Any authority that cannot be
 * authenticated remains absent from the result.
 */
export function snapshotListenerOwner(input: unknown): ListenerOwner {
  if (!Is.object(input) || Is.proxy(input)) return freeze({ raw: input });
  const finished = ownData(input, 'finished');
  const close = ownData(input, 'close');
  const server = ownData(input, 'server');
  const shutdown = server.ok && Is.object(server.value) && !Is.proxy(server.value)
    ? dataMethod(server.value, 'shutdown')
    : undefined;
  const port = ownData(input, 'port');
  const origin = ownData(input, 'origin');
  const hostname = ownData(input, 'hostname');
  const addr = ownData(input, 'addr');
  const addrHostname = addr.ok && Is.object(addr.value) && !Is.proxy(addr.value)
    ? ownData(addr.value, 'hostname')
    : NOT_DATA;
  const signal = ownData(input, 'signal');

  return freeze({
    raw: input,
    ...(finished.ok && isExactNativePromise(finished.value)
      ? { finished: finished.value as Promise<void> }
      : {}),
    ...(close.ok && Is.func(close.value)
      ? { close: close.value as (reason?: unknown) => unknown }
      : {}),
    ...(server.ok && Is.object(server.value) && !Is.proxy(server.value)
      ? { server: server.value as Deno.HttpServer<Deno.NetAddr> }
      : {}),
    ...(shutdown ? { shutdown } : {}),
    ...(port.ok && Num.Is.int(port.value) && port.value > 0 && port.value <= 65_535
      ? { port: port.value as t.PortNumber }
      : {}),
    ...(origin.ok && Is.string(origin.value) ? { origin: origin.value as t.StringUrl } : {}),
    ...(hostname.ok && Is.string(hostname.value)
      ? { hostname: hostname.value as t.StringHostname }
      : {}),
    ...(addrHostname.ok && Is.string(addrHostname.value)
      ? { addrHostname: addrHostname.value }
      : {}),
    ...(signal.ok && isExactAbortSignal(signal.value) ? { signal: signal.value } : {}),
  });
}

/**
 * Determine whether a listener snapshot contains every authority required by a public Dist host.
 */
export function isCompleteListenerOwner(
  owner: ListenerOwner,
): owner is CompleteListenerOwner {
  return owner.finished !== undefined && owner.close !== undefined && owner.server !== undefined &&
    owner.shutdown !== undefined && owner.port !== undefined && owner.origin !== undefined &&
    owner.hostname !== undefined && owner.addrHostname !== undefined && owner.signal !== undefined;
}

/**
 * Observe one admitted listener completion without Promise reaction-property dispatch.
 *
 * Settlement is recorded once, and a failing observer callback cannot rewrite lower completion.
 */
export function observeListener(
  finished: Promise<void>,
  onSettled: (failed: boolean) => void = () => undefined,
): ListenerObservation {
  let settled = false;
  let failed = false;
  const admitted = observeExactPromise<void>(finished, {
    fulfilled: () => settle(false),
    rejected: () => settle(true),
  });
  if (!admitted) throw startError('startup-failure');

  const observation: ListenerObservation = {
    get settled() {
      return settled;
    },
    get failed() {
      return failed;
    },
  };
  return observation;

  function settle(didFail: boolean): void {
    if (settled) return;
    failed = didFail;
    settled = true;
    try {
      onSettled(didFail);
    } catch {
      // Lower settlement remains owned when a package callback faults.
    }
  }
}

/**
 * Reject startup when a listener terminates during its first captured scheduler turn.
 */
export async function settleListener(observation: ListenerObservation): Promise<void> {
  await Schedule.macro();
  if (observation.settled) throw startError('startup-failure');
}

/**
 * Roll back one bound lower listener through captured close or direct shutdown authority.
 *
 * When bounded captured scheduler turns cannot prove termination, retain the owner and every
 * invoked operation whose settlement remains unobservable for the process lifetime. Startup never
 * hangs or reports termination it could not observe.
 */
export async function rollbackListenerOwner(
  owner: ListenerOwner,
  observed?: ListenerObservation,
): Promise<void> {
  const operations: unknown[] = [];
  let observation = observed;
  if (!observation && owner.finished) {
    try {
      observation = observeListener(owner.finished);
    } catch {
      // Direct shutdown may still terminate an owner whose completion cannot be admitted.
    }
  }
  if (observation?.settled) return;
  if (!isPromiseTransportReady()) {
    retainUntilPromiseTransport(owner, observation);
    return;
  }

  if (owner.close) {
    try {
      operations.push(apply(owner.close, owner.raw, ['dist-server.start.failed']));
    } catch {
      // Direct shutdown below remains independent rollback authority.
    }
    await Schedule.micro();
    for (let turn = 0; turn < 2 && !observation?.settled; turn += 1) {
      await Schedule.macro();
    }
    if (observation?.settled) return;
  }

  if (owner.shutdown && owner.server) {
    try {
      operations.push(apply(owner.shutdown, owner.server, []));
    } catch {
      // Retention below preserves unresolved direct-shutdown authority.
    }
  }

  for (let turn = 0; turn < 4 && !observation?.settled; turn += 1) {
    await Schedule.macro();
  }
  if (observation?.settled) return;

  RETAINED_LISTENER_OWNERS.add(freeze({
    owner,
    operations: freeze(operations),
    ...(observation ? { observation } : {}),
  }));
}

async function resumeLifeDisposal(life: t.Abortable, reason: unknown): Promise<void> {
  try {
    while (!isPromiseTransportReady()) await Schedule.macro();
    life.dispose(reason);
  } catch {
    // Retained lower ownership remains the process-lifetime fallback.
  }
}

function retainUntilPromiseTransport(
  owner: ListenerOwner,
  observation: ListenerObservation | undefined,
): void {
  const record: RetainedListenerOwner = freeze({
    owner,
    operations: freeze([]),
    ...(observation ? { observation } : {}),
  });
  RETAINED_LISTENER_OWNERS.add(record);
  void resumeRollback(record);
}

async function resumeRollback(record: RetainedListenerOwner): Promise<void> {
  try {
    while (!isPromiseTransportReady()) await Schedule.macro();
    await rollbackListenerOwner(record.owner, record.observation);
  } catch {
    // The retained owner remains the truthful process-lifetime fallback.
    return;
  }
  RETAINED_LISTENER_OWNERS.delete(record);
}

function isExactAbortSignal(input: unknown): input is AbortSignal {
  try {
    return Is.object(input) && !Is.proxy(input) &&
      getPrototypeOf(input) === NativeAbortSignalPrototype;
  } catch {
    return false;
  }
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
