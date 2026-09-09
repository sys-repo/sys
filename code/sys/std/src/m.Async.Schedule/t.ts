import type { t } from './common.ts';

/**
 * Asynchronous scheduling contracts.
 */
export namespace Schedule {
  /**
   * Defers callbacks and exposes awaitable host-queue hops.
   */
  export type Lib = {
    /**
     * Create a scheduler for `mode`, defaulting to `micro`.
     *
     * A lifecycle suppresses callbacks after disposal. No-argument hops remain awaitable and settle
     * independently of lifecycle state.
     */
    make(life?: t.LifeLike, mode?: AsyncSchedule): ScheduleFn;

    /**
     * Defer a callback or await one microtask.
     *
     * Schedule captures `queueMicrotask` when its module initializes. If that binding is unavailable,
     * it uses a reaction on a captured Promise instead. Later changes to ambient queue and Promise
     * bindings, or to Promise constructor and species properties, do not redirect scheduling or
     * result construction.
     *
     * Callback form returns `undefined`. Callback failures are not caught: `queueMicrotask` reports
     * them as host callback errors, while the fallback rejects the internal Promise created for its
     * reaction. That Promise is not returned. Awaitable form constructs its result through the
     * Promise binding captured at initialization.
     */
    micro: ScheduleFn;

    /**
     * Defer a callback or await one zero-delay timer task.
     *
     * Schedule uses the `setTimeout` binding captured when its module initializes; later ambient
     * replacement does not redirect the task. Callback form returns `undefined` and does not catch
     * failures. Awaitable form constructs its result through the captured Promise binding.
     */
    macro: ScheduleFn;

    /**
     * Defer a callback or await one animation-frame hop.
     *
     * Schedule uses the `requestAnimationFrame` binding captured at initialization. If unavailable,
     * it uses the captured timer with a 16 ms delay. Callback form returns `undefined`; awaitable form
     * constructs its result through the captured Promise binding.
     */
    raf: ScheduleFn;

    /**
     * Await a normalized number of sequential animation-frame hops.
     *
     * Omitted `count` means one hop. Finite values are floored and clamped to zero; non-finite values
     * produce no hops.
     */
    frames(count?: number): Promise<void>;

    /**
     * Wait for a timer requested with `ms`, then optionally await another scheduling hop.
     *
     * `undefined`, `null`, and `false` select no follow-on hop.
     */
    sleep(ms: t.Msecs, andThen?: t.AsyncSchedule | null | false): Promise<void>;

    /**
     * Queue `task` at most once and return its cancellation lifecycle.
     *
     * Timer delays normalize to the canonical `Time.Delay.MAX` ceiling. Disposal before
     * execution suppresses the task. Once admitted, the lifecycle disposes when the task settles,
     * including rejection; the task's result is not returned.
     */
    queue<T = unknown>(task: () => T | Promise<T>, opts?: ScheduleQueueOpts): t.Lifecycle;
    queue<T = unknown>(
      task: () => T | Promise<T>,
      queue?: ScheduleQueueConfig,
      until?: t.UntilInput,
    ): t.Lifecycle;

    /**
     * Await one zero-delay timer task followed by one microtask.
     *
     * This is equivalent to `await macro(); await micro();`. It does not claim that unrelated task
     * sources have run or drained.
     */
    tick(): Promise<void>;

    /**
     * Poll `pred` after successive timer-task → microtask turns.
     *
     * The first predicate check follows an initial turn. Polling stops when the predicate returns
     * `true` or the deadline derived from `timeoutMs` is reached. It does not drain unrelated task
     * sources.
     *
     * @param pred Synchronous completion predicate.
     * @param timeoutMs Maximum wait in milliseconds; defaults to 1500.
     * @throws Error when the deadline is reached first.
     */
    waitFor(pred: () => boolean, timeoutMs?: number): Promise<void>;
  };
}

/**
 * Host mechanism selected for a scheduling hop.
 *
 * - `micro`: captured `queueMicrotask`, with a captured Promise-reaction fallback.
 * - `macro`: captured `setTimeout` with a zero delay.
 * - `raf`: captured `requestAnimationFrame`, with a captured 16 ms timer fallback.
 */
export type AsyncSchedule = 'micro' | 'macro' | 'raf';

/** Options for `Schedule.queue` execution. */
export type ScheduleQueueOpts = { until?: t.UntilInput; queue?: ScheduleQueueConfig };

/** Queue selection for scheduled execution. */
export type ScheduleQueueConfig =
  | 'micro'
  | 'raf'
  | { frames: number }
  | { ms: t.Msecs };

/**
 * Callback and awaitable forms of one scheduling mode.
 *
 * Callback form queues work and returns `undefined`; the selected host mechanism may allocate its
 * own job or Promise. No-argument form returns a Promise constructed through the binding captured
 * when Schedule initializes. Later operations on that Promise retain JavaScript's ordinary Promise
 * prototype semantics.
 */
export type ScheduleFn = {
  /**
   * Queue `fn` and return `undefined`.
   */
  (fn: () => void): void;

  /**
   * Await one hop in the selected mode.
   */
  (): Promise<void>;
};
