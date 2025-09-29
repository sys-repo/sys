import type { t } from './common.ts';

/**
 * Scheduling mode.
 *
 * - "micro": queueMicrotask / Promise.then (runs after current stack, before timers)
 * - "macro": setTimeout(0) (next task tick)
 * - "raf":   requestAnimationFrame (frame-aligned; falls back to ~16ms timeout in non-DOM)
 */
export type AsyncSchedule = 'micro' | 'macro' | 'raf';

/**
 * Minimal, consistent API for deferring work (microtask, macrotask, or frame),
 * with lifecycle-aware and static forms.
 */
export type SchedulerLib = {
  /**
   * Create a lifecycle-aware scheduler in the given mode (default "micro").
   *
   * Usage:
   *   const schedule = scheduler(life)       // default "micro"
   *   schedule(() => { ... })                // fire & forget
   *   await schedule()                       // awaitable hop
   *
   *   const macro = scheduler(life, "macro") // pick a mode explicitly
   *   await macro()                          // await a macro hop
   */
  make(life?: t.LifeLike, mode?: AsyncSchedule): ScheduleFn;

  /**
   * Microtask scheduler.
   *
   * Fire & forget:
   *   micro(() => { ... })
   *
   * Awaitable hop:
   *   await micro()
   */
  micro: ScheduleFn;

  /**
   * Macrotask scheduler (next timer tick).
   *
   * Fire & forget:
   *   macro(() => { ... })
   *
   * Awaitable hop:
   *   await macro()
   */
  macro: ScheduleFn;

  /**
   * Frame-aligned scheduler (requestAnimationFrame).
   * Falls back to ~16ms timeout when RAF is unavailable.
   *
   * Fire & forget:
   *   raf(() => { ... })
   *
   * Awaitable hop:
   *   await raf()
   */
  raf: ScheduleFn;

  /**
   * Await N animation frames.
   *
   * Semantics:
   * - Resolves after `count` sequential frame hops from the call site.
   * - Uses `requestAnimationFrame` when available; otherwise falls back to ~16 ms timers.
   * - Intended for “paint, then settle” flows where layout/paint must occur before follow-up work.
   *
   * Notes:
   * - `count <= 0` resolves immediately.
   * - Equivalent to: `for (let i=0; i<count; i++) await raf();`
   */
  frames(count?: number): Promise<void>;

  /**
   * Run a task at most once, scheduled on a queue, tied to lifecycle.
   *
   * - If disposed before it runs, it won't fire.
   * - After it runs (or throws), the returned lifecycle auto-disposes.
   * - The task's return value is ignored.
   *
   * @example
   *   // Fire once on next microtask:
   *   Schedule.queue(() => { init(); });
   *
   * @example
   *   // Fire once after 2 frames:
   *   Schedule.queue(setupLayout, { queue: { frames: 2 } });
   *
   * @example
   *   // Fire once in ~150ms:
   *   Schedule.queue(() => { warmCaches(); }, { queue: { ms: 150 } });
   *
   * @example
   *   // Tie to a lifecycle:
   *   const life = Rx.lifecycle();
   *   Schedule.queue(() => start(), { until: life.dispose$ });
   *   life.dispose(); // cancels if not yet run
   */
  queue<T = unknown>(task: () => T | Promise<T>, opts?: ScheduleQueueOpts): t.Lifecycle;
  queue<T = unknown>(
    task: () => T | Promise<T>,
    queue?: ScheduleQueueConfig,
    until?: t.UntilInput,
  ): t.Lifecycle;
};

/** Options for `Schedule.queue` execution. */
export type ScheduleQueueOpts = { until?: t.UntilInput; queue?: ScheduleQueueConfig };
/** Queue options for scheduled execution. */
export type ScheduleQueueConfig =
  | 'micro' //              next microtask (queueMicrotask / Promise.then)
  | 'raf' //                next animation frame
  | { frames: number } //   after N animation frames - "rAF"
  | { ms: t.Msecs }; //     after N milliseconds (timer task via setTimeout) - "macro"

/**
 * Curried scheduler function:
 *
 * - Fire & forget (no Promise allocation):
 *     schedule(() => { ... })
 *
 * - Await a single hop (no callback):
 *     await schedule()
 */
export type ScheduleFn = {
  /** Schedule a task to run later (no Promise allocation). */
  (fn: () => void): void;

  /** Await a single hop in the chosen scheduling mode. */
  (): Promise<void>;
};
