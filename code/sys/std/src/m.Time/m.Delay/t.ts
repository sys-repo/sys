import type { t } from './common.ts';

/** Cancellable delays and their shared host-timer range. */
export type Lib = {
  /** Largest supported delay before signed 32-bit host-timer overflow, in milliseconds. */
  readonly MAX: t.Msecs;

  /** Create a cancellable delay. */
  readonly create: Fn;
};

/**
 * Schedule a callback and await its outcome.
 *
 * Omitting milliseconds queues a microtask. Numeric delays use host timers: negative, fractional,
 * non-finite, and unsafe-integer values become zero; larger safe integers clamp to `Time.Delay.MAX`.
 * The promise waits for the callback's synchronous or asynchronous completion without exposing its
 * return value.
 *
 * Cancellation or abort before the callback starts resolves quietly without invoking it.
 * Once the callback starts, its outcome determines whether the promise resolves or rejects;
 * later cancellation has no effect.
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
  signal?: AbortSignal;
};

/** A callback whose synchronous or asynchronous completion is observed; values are ignored. */
export type Callback = () => unknown;

/**
 * Completion of the delay and its callback, with cancellation and live status.
 * Resolves with `undefined` on success or cancellation before invocation; rejects with the original
 * callback throw or rejection reason. Callers must observe rejection, as with any Promise.
 * A callback that never settles keeps this Promise pending, even after cancellation or abort.
 */
export type Promise = globalThis.Promise<void> & Handle;

/** Cancellation and live status for a delay and its callback. */
export type Handle = t.Cancellable & {
  /** Prevent the callback from starting and resolve quietly; no effect after it starts. */
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
