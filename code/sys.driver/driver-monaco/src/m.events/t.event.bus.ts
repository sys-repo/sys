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
   * Emit an event to the bus on a chosen async-schedule.
   */
  emit: t.EmitEvent<t.EditorEvent>;
};
