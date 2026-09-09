type Deferred<T> = Readonly<{
  promise: Promise<T>;
  resolve(value: T | PromiseLike<T>): void;
  reject(cause?: unknown): void;
}>;

const NativePromise = Promise;
const NativeQueueMicrotask = globalThis.queueMicrotask;
const NativeAbortController = AbortController;
const apply = Reflect.apply;
const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const controllerSignal = getOwnPropertyDescriptor(AbortController.prototype, 'signal')?.get;
const controllerAbort = AbortController.prototype.abort;
const signalAborted = getOwnPropertyDescriptor(AbortSignal.prototype, 'aborted')?.get;
const signalReason = getOwnPropertyDescriptor(AbortSignal.prototype, 'reason')?.get;
const addEventListener = EventTarget.prototype.addEventListener;
const removeEventListener = EventTarget.prototype.removeEventListener;

/** Create one native deferred without consulting later ambient Promise statics. */
export function createDeferred<T>(): Deferred<T> {
  let resolveNative!: (value: T | PromiseLike<T>) => void;
  let rejectNative!: (cause?: unknown) => void;
  const promise = new NativePromise<T>((resolve, reject) => {
    resolveNative = resolve;
    rejectNative = reject;
  });
  return freeze({
    promise,
    resolve(value: T | PromiseLike<T>) {
      resolveNative(value);
    },
    reject(cause?: unknown) {
      rejectNative(cause);
    },
  });
}

/** Queue through the host primitive captured when the Dispose owner loaded. */
export function enqueueMicrotask(action: () => void): void {
  apply(NativeQueueMicrotask, globalThis, [action]);
}

/** Create one AbortController through captured construction and signal authority. */
export function createAbortOwner(): Readonly<{
  controller: AbortController;
  signal: AbortSignal;
}> {
  if (!controllerSignal) throw new TypeError('AbortController.signal unavailable');
  const controller = new NativeAbortController();
  const signal = apply(controllerSignal, controller, []) as AbortSignal;
  return freeze({ controller, signal });
}

/** Abort through the captured native method. */
export function abortController(controller: AbortController, reason?: unknown): void {
  apply(controllerAbort, controller, [reason]);
}

/** Read native AbortSignal state without later prototype lookup. */
export function isAbortSignalAborted(signal: AbortSignal): boolean {
  if (signalAborted) {
    try {
      return apply(signalAborted, signal, []) as boolean;
    } catch {
      // Preserve the established structural AbortSignal contract for non-native producers.
    }
  }
  return signal.aborted;
}

/** Read the native AbortSignal reason without later prototype lookup. */
export function abortSignalReason(signal: AbortSignal): unknown {
  if (signalReason) {
    try {
      return apply(signalReason, signal, []);
    } catch {
      // Preserve the established structural AbortSignal contract for non-native producers.
    }
  }
  return signal.reason;
}

/** Attach one abort listener through captured EventTarget authority. */
export function addAbortListener(signal: AbortSignal, listener: () => void): void {
  try {
    apply(addEventListener, signal, ['abort', listener, { once: true }]);
  } catch {
    signal.addEventListener('abort', listener, { once: true });
  }
}

/** Remove one abort listener through captured EventTarget authority. */
export function removeAbortListener(signal: AbortSignal, listener: () => void): void {
  try {
    apply(removeEventListener, signal, ['abort', listener]);
  } catch {
    signal.removeEventListener('abort', listener);
  }
}
