import type { t } from './common.ts';

export type EditorEventBus = t.Subject<t.EditorEvent>;
export type EmitSchedule = 'sync' | 'micro' | 'macro' | 'raf';

/**
 * Event bus helpers:
 */
export type EventBusLib = {
  /** Generate a new event-bus subject. */
  make(): t.EditorEventBus;

  /**
   * Emit to the bus with a chosen schedule.
   * - default: "micro" (safe against re-entrancy)
   * - "sync":   inline, immediate (use sparingly)
   * - "macro":  next timer tick
   * - "raf":    next animation frame (or ~16ms fallback)
   */
  emit(bus$: t.EditorEventBus, evt: t.EditorEvent, schedule?: EmitSchedule): void;
};
