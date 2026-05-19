import type { t } from './common.ts';

export declare namespace Time {
  /**
   * Helpers for working with time.
   */
  export type Lib = {
    /** Tools for working with an elapsed duration of time. */
    readonly Duration: Duration.Lib;

    /** Retrieve the current datetime. */
    readonly now: t.DateTime;

    /** Generate a new UTC datetime instance. */
    utc(input?: t.DateTimeInput): t.DateTime;

    /** Create a new TimeDuration */
    duration: Duration.Lib['create'];

    /** Time elapsed between two instants. */
    elapsed: Duration.Lib['elapsed'];

    /** Generates a new timer. */
    timer(start?: Date, options?: { round?: number }): Timer;

    /**
     * Run a function after a delay.
     *
     * Notes:
     *  • `delay(msecs, fn?)` → macrotask timer; cancellable via `.cancel()`.
     *  • `delay(fn?)`        → microtask tick (queues on Promise microtask).
     */
    delay: Delay.Fn;

    /**
     * Run a function repeatedly on a fixed interval until cancelled.
     *
     * Notes:
     *  • `interval(msecs, fn, options?)` → repeating timer; cancellable via `.cancel()`.
     *  • `interval(msecs, options, fn)` → same, with options before the callback.
     *  • Use `options.immediate` to run once before the first scheduled tick.
     */
    interval: Interval.Fn;

    /**
     * Wait for the specified milliseconds
     * (NB: use with `await`.)
     * @param msecs: delay in milliseconds.
     */
    wait(msecs?: t.Msecs, options?: { signal?: AbortSignal } | AbortSignal): Delay.Promise;

    /**
     * Wait until a predicate resolves truthy or timeout expires.
     * Evaluates `fn` repeatedly with a fixed interval.
     */
    waitFor<T>(
      fn: () => T | Promise<T>,
      options?: { readonly interval?: t.Msecs; readonly timeout?: t.Msecs; signal?: AbortSignal },
    ): Promise<T>;

    /** A Time helper that runs only until it has been disposed. */
    until(until?: t.UntilInput): Until;
  };

  /**
   * Options for frame-yield primitives.
   * - If provided, an aborted signal should prevent the callback from running
   *   and cause the promise to reject with an AbortError.
   */
  export type FrameOptions = { readonly signal?: AbortSignal };

  /**
   * Exposes timer functions that cease after a dispose signal is received.
   */
  export type Until = t.Lifecycle & {
    /** Delay for the specified milliseconds. */
    delay: Lib['delay'];

    /** Repeat on an interval until disposed. */
    interval: Lib['interval'];

    /** Wait for the specified milliseconds to pass. */
    wait: Lib['wait'];
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
    reset: () => Timer;
  };

  /** Delay timer types. */
  export namespace Delay {
    export type Fn = t.TimeDelayFn;
    export type Options = t.TimeDelayOptions;
    export type Callback = t.TimeDelayCallback;
    export type Promise = t.TimeDelayPromise;
    export type Handle = t.TimeDelay;
  }

  /** Interval timer types. */
  export namespace Interval {
    export type Fn = t.TimeIntervalFn;
    export type Options = t.TimeIntervalOptions;
    export type Callback = t.TimeIntervalCallback;
    export type Handle = t.TimeInterval;
  }

  /** Duration helper types. */
  export namespace Duration {
    export type Lib = t.TimeDurationLib;
    export type Input = t.TimeInput;
    export type Options = t.TimeDurationOptions;
    export type To = t.TimeDurationTo;
    export type Instance = t.TimeDuration;
  }
}

/** Compatibility alias for `Time.Lib`. */
export type TimeLib = Time.Lib;

/** Compatibility alias for `Time.FrameOptions`. */
export type TimeFrameOptions = Time.FrameOptions;

/** Compatibility alias for `Time.Until`. */
export type TimeUntil = Time.Until;

/** Compatibility alias for `Time.Timer`. */
export type Timer = Time.Timer;
