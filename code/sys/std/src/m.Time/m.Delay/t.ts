import type { t } from './common.ts';

/** Policy and behavior for creating delays backed by host timer queues. */
export type Lib = {
  /** Largest supported delay before signed 32-bit host-timer overflow, in milliseconds. */
  readonly MAX: t.Msecs;

  /** Create a cancellable delay. */
  readonly create: Fn;
};

/** Overloaded delay. */
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
  /** Abort to cancel the pending delay. */
  readonly signal?: AbortSignal;
};

/** A function called at the completion of a delay timer. */
export type Callback = () => void;

/** An extended Promise API that represents a running timer. */
export type Promise = globalThis.Promise<void> & Handle;

/** Extended properties on a delay Promise that represent a running timer. */
export type Handle = t.Cancellable & {
  /** Duration of the delay. */
  readonly timeout: t.Msecs;
  /** Boolean status flags. */
  readonly is: {
    /** True if the timer was cancelled. */
    readonly cancelled: boolean;
    /** True if the timer completed successfully. */
    readonly completed: boolean;
    /** True if the timer is done (completed OR failed). */
    readonly done: boolean;
  };
};
