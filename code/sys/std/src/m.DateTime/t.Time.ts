import type { t } from './common.ts';

/**
 * Library: helper for working with time.
 */
export type TimeLib = {
  /* Tools for working with an elapsed duration of time. */
  readonly Duration: t.TimeDurationLib;

  /* Retrieve the current datetime. */
  readonly now: t.DateTime;

  /* Create a new TimeDuration */
  duration: t.TimeDurationLib['create'];

  /* Generates a TimeDuration from the given time until now (or a specified other endpoint). */
  elapsed(from: t.DateTimeInput, options: { to?: t.DateTimeInput; round?: number }): t.TimeDuration;

  /* Generates a new timer. */
  timer(start?: Date, options?: { round?: number }): Timer;

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

  /* Generate a new UTC datetime instance. */
  utc(input?: t.DateTimeInput): t.DateTime;

  /* A Time helper that runs only until it has been disposed. */
  until(until$?: t.UntilObservable): t.TimeUntil;
};

/**
 * Timeout/Delay
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

  /* Stops the timer (dispose). */
  cancel(): void;
};

/**
 * A Time helper that runs only until it has been disposed.
 */
export type TimeUntil = {
  readonly dispose$: t.Observable<void>;
  readonly disposed: boolean;
  delay: t.TimeLib['delay'];
};

/**
 * A timer that records the elapsed time since a start date.
 */
export type Timer = {
  /* The starting datetime. */
  readonly startedAt: Date;

  /* The duration elapsed */
  readonly elapsed: t.TimeDuration;

  /* Reset the timer. */
  reset: () => t.Timer;
};
