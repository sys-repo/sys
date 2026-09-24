import type { t } from './common.ts';

/** Policy and behavior for creating delays backed by host timer queues. */
export type Lib = {
  /** Largest supported delay before signed 32-bit host-timer overflow, in milliseconds. */
  readonly MAX: t.Msecs;

  /** Create a cancellable delay. */
  readonly create: Fn;
};

/**
 * Schedule a callback and await its outcome.
 *
 * Omitted milliseconds select a microtask; numeric delays select a host timer and normalize
 * to the `Time.Delay.MAX` domain. Callback return values are ignored, but returned asynchronous
 * work must settle before the delay completes.
 *
 * Cancellation or abort before invocation resolves quietly without invoking the callback.
 * Once invoked, the callback's outcome owns settlement; later cancellation has no effect.
 */
export type Fn =
  & ((
    msecs: t.Msecs,
    fn?: Callback,
    options?: Options | AbortSignal | AbortController,
  ) => Promise)
  & ((fn?: Callback, options?: Options | AbortSignal | AbortController) => Promise)
  & ((options: Options | AbortSignal | AbortController) => Promise);

/** Options for `Time.Delay.create` and its `Time.delay` alias. */
export type Options = {
  /** Abort before callback invocation to cancel quietly; ignored once the callback starts. */
  readonly signal?: AbortSignal;
};

/** A callback whose synchronous or asynchronous completion is observed; values are ignored. */
export type Callback = () => unknown;

/**
 * Caller-owned completion of the delay and its callback.
 * Resolves with `undefined` on success or pre-invocation cancellation; rejects with the original
 * callback throw or rejection reason. Callers must observe rejection, as with any Promise.
 * A callback that never settles keeps this Promise pending, even after cancellation or abort.
 */
export type Promise = globalThis.Promise<void> & Handle;

/** Cancellation and live status for a delay and its callback. */
export type Handle = t.Cancellable & {
  /** Cancel only before callback invocation. Quiet, resolving, and idempotent. */
  readonly cancel: () => void;

  /** Normalized scheduling delay, or zero for a microtask; not a callback-execution deadline. */
  readonly timeout: t.Msecs;

  /** Terminal outcome flags; all remain false while scheduled or while the callback is running. */
  readonly is: {
    /** True only when cancellation prevented callback invocation. */
    readonly cancelled: boolean;
    /** True only when the callback completed successfully, or no callback was supplied. */
    readonly completed: boolean;
    /** True after completion, cancellation, or failure. */
    readonly done: boolean;
  };
};
