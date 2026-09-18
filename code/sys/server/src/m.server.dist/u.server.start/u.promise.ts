import { Is } from './common.ts';

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

/** Whether an input is one exact native Promise without caller-owned constructor authority. */
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
