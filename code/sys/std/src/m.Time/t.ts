import type {
  Callback as DelayCallback,
  Fn as DelayFn,
  Handle as DelayHandle,
  Lib as DelayLib,
  Options as DelayOptions,
  Promise as DelayPromise,
} from './m.Delay/t.ts';
import type {
  AmountInput as DurationAmountInput,
  Input as DurationInput,
  Instance as DurationInstance,
  InstantInput as DurationInstantInput,
  Lib as DurationLib,
  Options as DurationOptions,
  To as DurationTo,
} from './m.Duration/t.ts';
import type { t } from './common.ts';

/**
 * Clock snapshots, duration amounts, and cancellable scheduling.
 */
export declare namespace Time {
  /** Time operations with shared calendar, delay, and duration helpers. */
  export type Lib = {
    /** Calendar queries and date labels. */
    readonly Date: t.Date.Lib;

    /** One-shot scheduling and timer-delay normalization. */
    readonly Delay: Delay.Lib;

    /** Duration parsing, unit conversion, and elapsed-time calculations. */
    readonly Duration: Duration.Lib;

    /** A fresh snapshot of the current time, with local-zone formatting. */
    readonly now: t.DateTime;

    /**
     * Create a date-time snapshot. Despite the name, formatting uses the local time zone,
     * with 'yyyy-MM-dd' as the default template.
     *
     * Omitted input means now. Numbers are Unix milliseconds, not calendar dates.
     * ISO strings use their stated offset, or local time when none is given.
     * Native Date range and millisecond precision apply.
     *
     * Input and returned Dates are copies: changing either cannot change the snapshot.
     * Invalid input does not throw during construction; its timestamp is NaN and
     * format() throws RangeError('Time.utc: invalid date').
     */
    readonly utc: (input?: t.DateTimeInput) => t.DateTime;

    /** Compatibility alias of `Time.Duration.create`; accepts milliseconds or an amount string. */
    readonly duration: Duration.Lib['create'];

    /** Compatibility alias of `Time.Duration.elapsed`; measures between instants. */
    readonly elapsed: Duration.Lib['elapsed'];

    /** Create a wall-clock timer; copy the supplied start, or use the current time. */
    readonly timer: (start?: Date, options?: Duration.Options) => Timer;

    /**
     * Schedule a callback and observe its completion; alias of `Time.Delay.create`.
     * Omitting milliseconds queues a microtask; otherwise, the delay follows the host-timer policy.
     * Cancellation resolves quietly before the callback starts; afterward, its outcome determines
     * whether the promise resolves or rejects.
     */
    readonly delay: Delay.Fn;

    /**
     * Run a synchronous callback at a fixed cadence until cancellation or failure.
     * Accepts `interval(msecs, fn, options?)` or `interval(msecs, options, fn)`.
     * With `immediate: true`, the first callback runs synchronously before the repeating timer starts.
     * Milliseconds follow the same normalization policy as `Time.Delay`.
     */
    readonly interval: Interval.Fn;

    /** A callback-free delay; cancellation before the delay elapses resolves quietly. */
    readonly wait: (
      msecs?: t.Msecs,
      options?: Delay.Options | AbortSignal | AbortController,
    ) => Delay.Promise;

    /**
     * Wait for a truthy predicate result, with at most one invocation in progress.
     * Defaults to 30 ms between falsy results and a 2,000 ms monotonic timeout budget.
     *
     * The interval follows Delay normalization. The timeout must be finite, non-negative, and no
     * greater than Number.MAX_SAFE_INTEGER; fractions are allowed. Invalid budgets reject with
     * RangeError. A zero timeout or already-aborted signal prevents the first invocation.
     *
     * An observed abort takes precedence over expiry; both take precedence over a predicate outcome
     * at or beyond the deadline. Rejection preserves the abort reason or in-window predicate failure;
     * expiry rejects with Error('Time.waitFor: timeout exceeded'). A settled result never changes.
     *
     * Abort and expiry end observation even while a predicate is pending. Late outcomes are consumed
     * without affecting the result. Predicate work and its resources remain caller-owned; this waiter
     * neither cancels that work nor preempts synchronous code or a blocked event loop.
     */
    readonly waitFor: <T>(
      fn: () => T | Promise<T>,
      options?: { interval?: t.Msecs; timeout?: t.Msecs; signal?: AbortSignal },
    ) => Promise<T>;

    /** Create a timer scope whose disposal cancels pending delays and active intervals. */
    readonly until: (until?: t.UntilInput) => Until;
  };

  /**
   * A cancellation scope for delays, waits, and intervals, retaining the root overloads.
   * Caller signals remain effective. Disposal prevents new callbacks from starting; a delay callback
   * already in progress still determines its promise's outcome. Finished children detach from the
   * scope without disposing it or changing how failures are reported.
   *
   * Already-disposed lifecycle views and aborted signals prevent even immediate callbacks.
   * Observable-only inputs cancel on emission; no separate disposal state is inferred.
   */
  export type Until = t.Lifecycle & {
    /** Delay a callback within this scope; disposal cancels it only before it starts. */
    readonly delay: Lib['delay'];

    /** Repeat a synchronous callback until it fails, is cancelled, or this scope is disposed. */
    readonly interval: Lib['interval'];

    /** Wait within this scope; disposal resolves a pending wait quietly. */
    readonly wait: Lib['wait'];
  };

  /**
   * A wall-clock timer, not a monotonic stopwatch. System clock changes affect elapsed time.
   * Supplied and returned Dates are independent copies.
   */
  export type Timer = {
    /** A fresh Date copy of the start time from creation or the latest reset. */
    readonly startedAt: Date;

    /** Elapsed wall-clock time; invalid if the current time is earlier than the start. */
    readonly elapsed: Duration.Instance;

    /** Start again from the current time and return this timer. */
    readonly reset: () => Timer;
  };

  /**
   * One-shot scheduling with cancellation before callback execution.
   */
  export namespace Delay {
    /** Cancellable delays and their shared host-timer range. */
    export type Lib = DelayLib;

    /** Schedule a callback with optional milliseconds and cancellation. */
    export type Fn = DelayFn;

    /** Options for `Time.Delay.create` and its `Time.delay` alias. */
    export type Options = DelayOptions;

    /** A callback whose synchronous or asynchronous completion is observed; values are ignored. */
    export type Callback = DelayCallback;

    /** Caller-owned completion of the delay and its callback; callback failures reject it. */
    export type Promise = DelayPromise;

    /** Cancellation and live status for a delay and its callback. */
    export type Handle = DelayHandle;
  }

  /**
   * Fixed-cadence scheduling for synchronous callbacks.
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
      signal?: AbortSignal;
      /** Run the callback once immediately before scheduling the repeating interval. */
      immediate?: boolean;
    };

    /**
     * One synchronous callback per tick. Ordinary return values are ignored; thenables are unsupported.
     * Cancelling or aborting inside the callback does not suppress a subsequent callback failure.
     */
    export type Callback = () => void;

    /** Handle for one running interval. */
    export type Handle = t.Cancellable & {
      /** Normalized interval in milliseconds, not a callback-execution deadline. */
      readonly interval: t.Msecs;
      /** Live state; cancellation never hides a callback failure. */
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
   * Non-negative duration amounts and differences between instants.
   */
  export namespace Duration {
    /** Duration parsing, conversion, and elapsed-time calculations. */
    export type Lib = DurationLib;

    /** Milliseconds or a complete decimal amount with an optional unit. */
    export type AmountInput = DurationAmountInput;

    /** Unix milliseconds, numeric strings, or date strings for elapsed endpoints. */
    export type InstantInput = DurationInstantInput;

    /** Compatibility alias of `AmountInput`; use `InstantInput` for elapsed endpoints. */
    export type Input = DurationInput;

    /** Rounding for derived duration values. */
    export type Options = DurationOptions;

    /** Fixed-unit arithmetic with optional rounding. */
    export type To = DurationTo;

    /** A duration amount, or an invalid result with `ok: false`. */
    export type Instance = DurationInstance;
  }
}
