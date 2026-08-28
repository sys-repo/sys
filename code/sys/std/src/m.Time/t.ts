import type * as TDelay from './m.Delay/t.ts';
import type * as TDuration from './m.Duration/t.ts';
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

  /**
   * Delay timer types.
   */
  export namespace Delay {
    /** Policy and behavior for creating delays backed by host timer queues. */
    export type Lib = TDelay.Lib;

    /** Overloaded delay. */
    export type Fn = TDelay.Fn;

    /** Options for `Time.Delay.create` and its `Time.delay` alias. */
    export type Options = TDelay.Options;

    /** A function called at the completion of a delay timer. */
    export type Callback = TDelay.Callback;

    /** An extended Promise API that represents a running timer. */
    export type Promise = TDelay.Promise;

    /** Extended properties on a delay Promise that represent a running timer. */
    export type Handle = TDelay.Handle;
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

  /**
   * Duration helper types.
   */
  export namespace Duration {
    /** Tools for working with an elapsed duration of time. */
    export type Lib = TDuration.Lib;

    /** Input for time-duration helpers. */
    export type Input = TDuration.Input;

    /** Options passed to a duration helper. */
    export type Options = TDuration.Options;

    /** Time duration conversions. */
    export type To = TDuration.To;

    /** Represents an elapsed duration of time. */
    export type Instance = TDuration.Instance;
  }
}
