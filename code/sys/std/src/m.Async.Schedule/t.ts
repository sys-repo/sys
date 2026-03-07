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
   * Macrotask scheduler (next task tick).
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
   * Sleep for N milliseconds (timer-backed).
   *
   * Semantics:
   * - Resolves after at least `ms` have elapsed.
   * - If `andThen` is provided, performs a hop on that scheduler queue after the timer.
   * - If `andThen` is omitted/undefined, no extra hop is performed.
   */
  sleep(ms: t.Msecs, andThen?: t.AsyncSchedule | null | false): Promise<void>;

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

  /**
   * Advance one full asynchronous turn.
   *
   * Semantics:
   * - Performs a macrotask hop, then a microtask hop.
   * - This mirrors how MessagePort deliveries land: tasks (macro) first,
   *   followed by any queued microtasks scheduled by those handlers.
   *
   * Notes:
   * - Equivalent to: `await macro(); await micro();`
   * - Does not use timers (no real-time delay) or requestAnimationFrame
   *   (no frame alignment); it only advances the task + microtask queues.
   */
  tick(): Promise<void>;

  /**
   * Repeatedly advance asynchronous turns until a predicate succeeds.
   *
   * Semantics:
   * - Calls `tick()` in a loop until `pred()` returns true or the timeout elapses.
   * - Each cycle advances a full async-turn (macro → micro), ensuring that
   *   all queued MessagePort deliveries and associated microtasks have been
   *   flushed before re-checking the predicate.
   *
   * Use cases:
   * - Worker → main thread wire propagation.
   * - Awaiting eventual consistency without relying on timers.
   *
   * @param pred       A synchronous check for the desired condition.
   * @param timeoutMs  Maximum time to wait before erroring (default: 1500ms).
   *
   * @throws Error     If the deadline is exceeded.
   */
  waitFor(pred: () => boolean, timeoutMs?: number): Promise<void>;
};

/** Options for `Schedule.queue` execution. */
export type ScheduleQueueOpts = { until?: t.UntilInput; queue?: ScheduleQueueConfig };

/** Queue options for scheduled execution. */
export type ScheduleQueueConfig =
  | 'micro' //              next microtask (queueMicrotask / Promise.then)
  | 'raf' //                next animation frame
  | { frames: number } //   after N animation frames
  | { ms: t.Msecs }; //     after N milliseconds (timer task via setTimeout)

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
