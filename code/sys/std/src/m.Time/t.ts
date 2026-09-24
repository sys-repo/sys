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
     *  • `delay(fn?)` → microtask tick.
     *  • Callback completion settles the returned Promise; callback failures reject it.
     *  • Cancellation resolves quietly only before callback invocation.
     */
    delay: Delay.Fn;

    /**
     * Run a synchronous callback on a fixed interval until cancellation or failure.
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

    /** Create a timer scope whose disposal cancels pending delays and active intervals. */
    until(until?: t.UntilInput): Until;
  };

  /**
   * Options for frame-yield primitives.
   * - If provided, an aborted signal should prevent the callback from running
   *   and cause the promise to reject with an AbortError.
   */
  export type FrameOptions = { readonly signal?: AbortSignal };

  /**
   * Root timer overloads with an additional parent cancellation lifetime.
   * Caller signals remain effective. Disposal prevents new callback admission, but an admitted
   * Delay callback still owns its outcome. Children release their parent subscriptions at termination
   * without disposing the scope or changing the root error channels.
   *
   * Already-disposed lifecycle views and aborted lifetime signals prevent immediate admission too.
   * Observable-only lifetime inputs retain Dispose's emission semantics; they carry no past state.
   */
  export type Until = t.Lifecycle & {
    /** Root Delay contract, also cancelled by scope disposal before callback admission. */
    delay: Lib['delay'];

    /** Root interval contract, also stopped by scope disposal. */
    interval: Lib['interval'];

    /** Root wait contract, also cancelled by scope disposal. */
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

    /** A callback whose synchronous or asynchronous completion is observed; values are ignored. */
    export type Callback = TDelay.Callback;

    /** Caller-owned completion of the delay and its callback; callback failures reject it. */
    export type Promise = TDelay.Promise;

    /** Cancellation and live status for a delay and its callback. */
    export type Handle = TDelay.Handle;
  }

  /**
   * Interval timer types.
   */
  export namespace Interval {
    /**
     * Run a synchronous callback repeatedly until cancelled or failed.
     * A callback throw stops the interval and releases its timer and abort listener before the
     * original value is rethrown: to the host for scheduled ticks, or synchronously from this call
     * for an immediate tick. A throwing immediate tick returns no handle.
     *
     * Returning a thenable is unsupported: stop and report one TypeError through the same channel.
     * Its settlement and any Promise returned by its `then` method are consumed to prevent additional
     * rejection reports, not to schedule more ticks.
     */
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

    /**
     * One synchronous callback per tick. Ordinary return values are ignored; thenables are unsupported.
     * Cancelling or aborting inside the callback does not suppress a subsequent callback failure.
     */
    export type Callback = () => void;

    /** Handle for one running interval. */
    export type Handle = t.Cancellable & {
      /** Configured interval duration. */
      readonly interval: t.Msecs;
      /** Boolean status flags. */
      readonly is: {
        /** True after cancellation or abort, unless an admitted callback subsequently fails. */
        readonly cancelled: boolean;
        /** True after callback failure or an unsupported thenable return; cancellation cannot clear it. */
        readonly failed: boolean;
        /** True after cancellation or failure. */
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
