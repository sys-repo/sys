import type { t } from './common.ts';

/**
 * Helpers for working with time.
 */
export type TimeLib = {
  /** Tools for working with an elapsed duration of time. */
  readonly Duration: t.TimeDurationLib;

  /** Retrieve the current datetime. */
  readonly now: t.DateTime;

  /** Create a new TimeDuration */
  duration: t.TimeDurationLib['create'];

  /** Time elapsed between two instants. */
  elapsed: t.TimeDurationLib['elapsed'];

  /** Generates a new timer. */
  timer(start?: Date, options?: { round?: number }): Timer;

  /**
   * Run a function after a delay.
   *
   * Notes:
   *  • `delay(msecs, fn?)` → macrotask timer; cancellable via `.cancel()`.
   *  • `delay(fn?)`        → microtask tick (queues on Promise microtask).
   */
  delay(msecs: t.Msecs, fn?: t.TimeDelayCallback): t.TimeDelayPromise;
  delay(fn?: t.TimeDelayCallback): t.TimeDelayPromise;

  /**
   * Wait for the specified milliseconds
   * (NB: use with `await`.)
   * @param msecs: delay in milliseconds.
   */
  wait(msecs?: t.Msecs): t.TimeDelayPromise;

  /** Generate a new UTC datetime instance. */
  utc(input?: t.DateTimeInput): t.DateTime;

  /** A Time helper that runs only until it has been disposed. */
  until(until$?: t.DisposeInput): t.TimeUntil;

  /**
   * Yield to the next animation frame.
   * - SSR/Node fallback: schedules a 0 ms macrotask.
   * - If `signal` aborts before the frame, the promise rejects with `AbortError`.
   */
  nextFrame(opts?: t.TimeFrameOptions | AbortSignal): Promise<void>;
};

/**
 * Options for frame-yield primitives.
 * - If provided, an aborted signal should prevent the callback from running
 *   and cause the promise to reject with an AbortError.
 */
export type TimeFrameOptions = { readonly signal?: AbortSignal };

/**
 * Timeout/Delay
 */

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

/**
 * Exposes timer functions that cease after a dispose signal is received.
 */
export type TimeUntil = t.Lifecycle & {
  /** Delay for the specified milliseconds. */
  delay: t.TimeLib['delay'];

  /** Wait for the specified milliseconds to pass. */
  wait: t.TimeLib['wait'];
};

/**
 * A timer that records the elapsed time since a start date.
 */
export type Timer = {
  /** The starting datetime. */
  readonly startedAt: Date;

  /** The duration elapsed */
  readonly elapsed: t.TimeDuration;

  /** Reset the timer. */
  reset: () => t.Timer;
};
