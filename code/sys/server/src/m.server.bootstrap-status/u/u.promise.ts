import { Is } from '../common.ts';

export type PromiseDeferred<T> = Readonly<{
  promise: Promise<T>;
  resolve(value: T): void;
  reject(cause?: unknown): void;
}>;

type PromiseHandlers<T> = Readonly<{
  fulfilled(value: T): void;
  rejected(cause: unknown): void;
}>;

const NativePromise = Promise;
const NativePromisePrototype = NativePromise.prototype;
const NativeQueueMicrotask = globalThis.queueMicrotask;
const NativeSetTimeout = globalThis.setTimeout;
const PromiseSpecies = Symbol.species;
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

/** Create one exact native deferred without consulting later ambient Promise bindings. */
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

/** Resolve after one captured host microtask. */
export function microtaskPromise(): Promise<void> {
  const deferred = createPromiseDeferred<void>();
  NativeQueueMicrotask(() => deferred.resolve());
  return deferred.promise;
}

/** Resolve after one captured host macrotask. */
export function macrotaskPromise(): Promise<void> {
  const deferred = createPromiseDeferred<void>();
  NativeSetTimeout(() => deferred.resolve(), 0);
  return deferred.promise;
}

/** Whether later ambient mutation preserved the captured Promise substrate. */
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

/** Attach one internally owned async observer without Promise reaction-property dispatch. */
export function observeExactPromise<T>(input: unknown, handlers: PromiseHandlers<T>): boolean {
  if (!isExactNativePromise(input)) return false;
  void settleObserved(input, handlers);
  return true;
}

/** Resolve when the first exact native input settles. */
export function firstSettlement(inputs: readonly Promise<unknown>[]): Promise<void> {
  const deferred = createPromiseDeferred<void>();
  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    deferred.resolve();
  };
  let observed = false;
  for (const input of inputs) {
    observed = observeExactPromise(input, { fulfilled: settle, rejected: settle }) || observed;
  }
  if (!observed) settle();
  return deferred.promise;
}

/** Await one exact lower completion and collapse its raw rejection to a boolean. */
export async function promiseFailed(input: unknown): Promise<boolean> {
  if (!isExactNativePromise(input)) return true;
  try {
    await input;
    return false;
  } catch {
    return true;
  }
}

export function isExactNativePromise(input: unknown): input is Promise<unknown> {
  try {
    return Is.object(input) && !Is.Native.proxy(input) && Is.Native.promise(input) &&
      getPrototypeOf(input) === NativePromisePrototype &&
      getOwnPropertyDescriptor(input, 'constructor') === undefined;
  } catch {
    return false;
  }
}

async function settleObserved<T>(input: Promise<T>, handlers: PromiseHandlers<T>): Promise<void> {
  try {
    const value = await input;
    try {
      handlers.fulfilled(value);
    } catch {
      // Observer callbacks cannot create an unowned completion rejection.
    }
  } catch (cause) {
    try {
      handlers.rejected(cause);
    } catch {
      // Observer callbacks cannot create an unowned completion rejection.
    }
  }
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
