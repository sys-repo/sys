import { Is } from './common.ts';

type PromiseTransportObservation<R> =
  | Readonly<{ kind: 'observed'; promise: Promise<R> }>
  | Readonly<{ kind: 'invalid' }>;

export type PromiseDeferred<T> = Readonly<{
  promise: Promise<T>;
  resolve(value: T): void;
  reject(cause?: unknown): void;
}>;

export const PROMISE_TRANSPORT_ERROR = 'start:gui Promise transport unavailable.';

const NativePromise = Promise;
const NativePromisePrototype = NativePromise.prototype;
const NativePromiseThen = NativePromisePrototype.then;
const NativeQueueMicrotask = globalThis.queueMicrotask;
const PromiseSpecies = Symbol.species;
const apply = Reflect.apply;
const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const expectedGlobalPromise = snapshotDescriptor(
  getOwnPropertyDescriptor(globalThis, 'Promise'),
);
const expectedPrototypeConstructor = snapshotDescriptor(
  getOwnPropertyDescriptor(NativePromisePrototype, 'constructor'),
);
const expectedSpecies = snapshotDescriptor(
  getOwnPropertyDescriptor(NativePromise, PromiseSpecies),
);
const ignoreRejection = () => undefined;

/** Create one exact native deferred without consulting later ambient Promise bindings or methods. */
export function createPromiseDeferred<T>(): PromiseDeferred<T> {
  let resolveNative!: (value: T | PromiseLike<T>) => void;
  let rejectNative!: (cause?: unknown) => void;
  const promise = new NativePromise<T>((resolve, reject) => {
    resolveNative = resolve;
    rejectNative = reject;
  });
  return freeze({
    promise,
    resolve(value: T) {
      resolveNative(value);
    },
    reject(cause?: unknown) {
      rejectNative(cause);
    },
  });
}

/** Create one fulfilled exact native Promise without consulting ambient Promise.resolve. */
export function resolvedPromise(): Promise<void>;
export function resolvedPromise<T>(value: T): Promise<T>;
export function resolvedPromise<T>(value?: T): Promise<T | void> {
  const deferred = createPromiseDeferred<T | void>();
  deferred.resolve(value);
  return deferred.promise;
}

/** Create one deliberately pending exact native Promise. */
export function pendingPromise<T>(): Promise<T> {
  return createPromiseDeferred<T>().promise;
}

/** Queue package work through the captured host microtask primitive. */
export function enqueueMicrotask(action: () => void): void {
  apply(NativeQueueMicrotask, globalThis, [action]);
}

/** Resolve one exact native Promise after a captured microtask turn. */
export function microtaskPromise<T>(action: () => T): Promise<T> {
  const deferred = createPromiseDeferred<T>();
  enqueueMicrotask(() => {
    try {
      deferred.resolve(action());
    } catch (cause) {
      deferred.reject(cause);
    }
  });
  return deferred.promise;
}

/** Whether later ambient mutation has preserved the captured Promise reaction substrate. */
export function isPromiseTransportReady(): boolean {
  try {
    return sameDescriptor(
      getOwnPropertyDescriptor(globalThis, 'Promise'),
      expectedGlobalPromise,
    ) && sameDescriptor(
      getOwnPropertyDescriptor(NativePromisePrototype, 'constructor'),
      expectedPrototypeConstructor,
    ) && sameDescriptor(
      getOwnPropertyDescriptor(NativePromise, PromiseSpecies),
      expectedSpecies,
    );
  } catch {
    return false;
  }
}

/** Attach captured intrinsic reactions to one admitted native Promise transport. */
export function observePromiseTransport<T, R>(
  input: unknown,
  handlers: Readonly<{
    fulfilled: (value: T) => R;
    rejected: (cause: unknown) => R;
  }>,
): PromiseTransportObservation<R> {
  try {
    if (!isPromiseTransport(input)) return INVALID;

    const promise = apply(NativePromiseThen, input, [
      handlers.fulfilled,
      handlers.rejected,
    ]) as Promise<R>;
    void apply(NativePromiseThen, promise, [undefined, ignoreRejection]);
    return freeze({ kind: 'observed', promise });
  } catch {
    return INVALID;
  }
}

/**
 * Promise transport objects are trusted only after exact native admission.
 *
 * Fulfillment and rejection values remain untrusted. Proxies, subclasses, thenables, cross-realm
 * promises, and promises with caller-owned constructor authority stay outside this boundary.
 */
export function isPromiseTransport(input: unknown): input is Promise<unknown> {
  if (!isPromiseTransportReady()) return false;
  if (!Is.object(input) || Is.proxy(input) || !Is.nativePromise(input)) return false;
  if (getPrototypeOf(input) !== NativePromisePrototype) return false;
  return getOwnPropertyDescriptor(input, 'constructor') === undefined;
}

function snapshotDescriptor(
  descriptor: PropertyDescriptor | undefined,
): Readonly<PropertyDescriptor> | undefined {
  if (!descriptor) return;
  return freeze(
    'value' in descriptor
      ? {
        configurable: descriptor.configurable,
        enumerable: descriptor.enumerable,
        value: descriptor.value,
        writable: descriptor.writable,
      }
      : {
        configurable: descriptor.configurable,
        enumerable: descriptor.enumerable,
        get: descriptor.get,
        set: descriptor.set,
      },
  );
}

function sameDescriptor(
  actual: PropertyDescriptor | undefined,
  expected: Readonly<PropertyDescriptor> | undefined,
): boolean {
  if (!actual || !expected) return false;
  if (
    actual.configurable !== expected.configurable ||
    actual.enumerable !== expected.enumerable ||
    ('value' in actual) !== ('value' in expected)
  ) return false;
  return 'value' in actual && 'value' in expected
    ? actual.value === expected.value && actual.writable === expected.writable
    : actual.get === expected.get && actual.set === expected.set;
}

const INVALID: PromiseTransportObservation<never> = freeze({ kind: 'invalid' });
