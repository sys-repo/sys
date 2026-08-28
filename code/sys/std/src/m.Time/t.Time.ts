import type { t } from './common.ts';

/**
 * Type namespace for the `Time` runtime surface.
 */
export declare namespace Time {
  /**
   * Helpers for working with time.
   */
  export type Lib = {
    /** Tools for working with calendar dates. */
    readonly Date: t.Date.Lib;

    /** Policy and behavior for creating timer-backed delays. */
    readonly Delay: Delay.Lib;

    /** Tools for working with an elapsed duration of time. */
    readonly Duration: Duration.Lib;

    /** Retrieve the current datetime. */
    readonly now: t.DateTime;

    /** Generate a new UTC datetime instance. */
    utc(input?: t.DateTimeInput): t.DateTime;

    /** Create a new duration helper. */
    duration: Duration.Lib['create'];

    /** Time elapsed between two instants. */
    elapsed: Duration.Lib['elapsed'];

    /** Generates a new timer. */
    timer(start?: Date, options?: { round?: number }): Timer;

    /**
     * Convenience alias of `Time.Delay.create`.
     *
     * Notes:
     *  • `delay(msecs, fn?)` → macrotask timer; cancellable via `.cancel()`.
     *  • Timer delays normalize to the `Time.Delay.MAX` domain ceiling.
     *  • `delay(fn?)`        → microtask tick (queues on Promise microtask).
     */
    delay: Delay.Fn;

    /**
     * Run a function repeatedly on a fixed interval until cancelled.
     *
     * Notes:
     *  • `interval(msecs, fn, options?)` → repeating timer; cancellable via `.cancel()`.
     *  • Timer intervals normalize to the `Time.Delay.MAX` domain ceiling.
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

    /** The duration elapsed. */
    readonly elapsed: Duration.Instance;

    /** Reset the timer. */
    reset: () => Timer;
  };

  /** Delay timer types. */
  export namespace Delay {
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
  }

  /** Interval timer types. */
  export namespace Interval {
    /** Overloaded interval. */
    export type Fn =
      & ((
        msecs: t.Msecs,
        fn: Callback,
        options?: Options | AbortSignal | AbortController,
      ) => Handle)
      & ((
        msecs: t.Msecs,
        options: Options | AbortSignal | AbortController,
        fn: Callback,
      ) => Handle);

    /** Options for `Time.interval`. */
    export type Options = {
      /** Abort to cancel the running interval. */
      readonly signal?: AbortSignal;
      /** Run the callback once immediately before scheduling the repeating interval. */
      readonly immediate?: boolean;
    };

    /** One callback invoked on each interval tick. */
    export type Callback = () => void;

    /** Handle for one running interval. */
    export type Handle = t.Cancellable & {
      /** Configured interval duration. */
      readonly interval: t.Msecs;
      /** Boolean status flags. */
      readonly is: {
        /** True if the interval has been cancelled. */
        readonly cancelled: boolean;
        /** True if the interval is no longer running. */
        readonly done: boolean;
        /** True while the interval is still active. */
        readonly running: boolean;
      };
    };
  }

  /** Duration helper types. */
  export namespace Duration {
    /** Tools for working with an elapsed duration of time. */
    export type Lib = {
      /** Time duration conversions. */
      readonly To: To;

      /** Create a new duration helper. */
      create(duration: Input, options?: Options): Instance;

      /** Parses a string or a number (eg. "3.5h") into a duration helper. */
      parse(input: Input, options?: Options): Instance;

      /** Format milliseconds to a display string. */
      format(msec: t.Msecs, unit: t.TimeUnit, round?: number): string;

      /**
       * Time elapsed between two instants.
       * @param start earlier instant (ms or ISO string).
       * @param end later instant (default `Date.now()`).
       */
      elapsed(start: Input, end?: Input, options?: Options): Instance;
    };

    /** Input for time-duration helpers. */
    export type Input = string | t.Msecs;

    /** Options passed to a duration helper. */
    export type Options = {
      /** Number of decimal places to round to. */
      round?: number;
    };

    /** Time duration conversions. */
    export type To = {
      sec(msec: t.Msecs, round?: number): t.Secs;
      min(msec: t.Msecs, round?: number): t.Secs;
      hour(msec: t.Msecs, round?: number): t.Secs;
      day(msec: t.Msecs, round?: number): t.Secs;
    };

    /** Represents an elapsed duration of time. */
    export type Instance = t.TimeDuration;
  }
}
