import type { t } from './common.ts';

/** Event filtering on editor events. */
export type EditorBusFilterLib = t.EventFilterLib<t.EditorEvent>;

/**
 * Event-bus helpers.
 */
export type EditorBusLib = {
  /** Event filtering tools. */
  readonly Filter: EditorBusFilterLib;

  /** Generate a new event-bus subject. */
  make(): t.EditorEventBus;

  /**
   * Emit to the bus with a chosen schedule.
   * - default: "micro" (safe against re-entrancy)
   * - "sync":   inline, immediate (use sparingly)
   * - "macro":  next timer tick
   * - "raf":    next animation frame (or ~16ms fallback)
   */
  emit(bus$: t.EditorEventBus, evt: t.EditorEvent, schedule?: t.EmitEventSchedule): void;
};
