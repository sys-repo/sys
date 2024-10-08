import type { t } from './common.ts';

/**
 * Library: helper for working with time.
 */
export type TimeLib = {
  /**
   * Run a function after a delay.
   */
  delay(msecs: t.Msecs, fn?: t.TimeDelayCallback): t.TimeDelayPromise;
  delay(fn?: t.TimeDelayCallback): t.TimeDelayPromise;

  /**
   * Wait for the specified milliseconds
   * NB: use with [await].
   */
  wait(msecs: t.Msecs): t.TimeDelayPromise;
};

/**
 * Timout/Delay
 */

/* A function called at the completion of a delay timer. */
export type TimeDelayCallback = () => void;

/* An extended Promise API that represents a running timer. */
export type TimeDelayPromise = Promise<void> & t.TimeDelay;

/* Extended properties on a delay Promise that represent a running timer. */
export type TimeDelay = {
  /* Duration of the delay. */
  readonly timeout: t.Msecs;

  /* Boolean status flags. */
  readonly is: {
    /* True if the timer was cancelled.  */
    readonly cancelled: boolean;

    /* True if the timer completed successfully. */
    readonly completed: boolean;

    /* True if the timer is "done" (completed OR failed). */
    readonly done: boolean;
  };

  /* Stops the timer. */
  cancel(): void;
};
