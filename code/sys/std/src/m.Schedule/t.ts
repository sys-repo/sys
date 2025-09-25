import type { t } from './common.ts';

/**
 * Scheduling mode.
 *
 * - "micro": queueMicrotask / Promise.then (runs after current stack, before timers)
 * - "macro": setTimeout(0) (next task tick)
 * - "raf":   requestAnimationFrame (frame-aligned; falls back to ~16ms timeout in non-DOM)
 */
export type ScheduleMode = 'micro' | 'macro' | 'raf';

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
  make(life: t.LifeLike, mode?: ScheduleMode): ScheduleFn;

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
   * Await two animation frames.
   *
   * Semantics:
   * - Resolves after two sequential frame hops from the call site.
   * - Uses `requestAnimationFrame` when available; otherwise falls back to ~16 ms timers.
   * - Intended for "paint, then settle" flows where layout/paint must occur before follow-up work.
   *
   * Notes:
   * - This is a convenience built on top of `raf()`; equivalent to:
   *     await raf(); await raf();
   */
  doubleFrame(): Promise<void>;
};

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
