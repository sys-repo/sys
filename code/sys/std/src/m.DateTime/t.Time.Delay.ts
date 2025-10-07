import type { t } from './common.ts';

/** Overloaded delay. */
export type TimeDelayFn =
  // ms-first
  ((msecs: t.Msecs, fn?: t.TimeDelayCallback, options?: TimeDelayOptsInput) => t.TimeDelayPromise) &
    // fn-first (micro)
    ((fn?: t.TimeDelayCallback, options?: TimeDelayOptsInput) => t.TimeDelayPromise) &
    // options-only (micro)
    ((options: TimeDelayOptsInput) => t.TimeDelayPromise);

type TimeDelayOptsInput = TimeDelayOptions | AbortSignal | AbortController;

/** Options for Time.delay. */
export type TimeDelayOptions = {
  /** Abort to cancel the pending delay. */
  readonly signal?: AbortSignal;
};

/** A function called at the completion of a delay timer. */
export type TimeDelayCallback = () => void;

/** An extended Promise API that represents a running timer. */
export type TimeDelayPromise = Promise<void> & t.TimeDelay;

/** Extended properties on a delay Promise that represent a running timer. */
export type TimeDelay = {
  /** Duration of the delay. */
  readonly timeout: t.Msecs;

  /** Boolean status flags. */
  readonly is: {
    /** True if the timer was cancelled.  */
    readonly cancelled: boolean;
    /** True if the timer completed successfully. */
    readonly completed: boolean;
    /** True if the timer is "done" (completed OR failed). */
    readonly done: boolean;
  };

  /** Stops the timer (dispose). */
  cancel(): void;
};
