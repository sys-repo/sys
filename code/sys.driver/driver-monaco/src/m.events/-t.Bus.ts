import type { t } from './common.ts';

/** Flags representing async schedule to fire on. */
export type EmitSchedule = 'sync' | 'micro' | 'macro' | 'raf';

/** Type guards (reusable as predicates or inside Rx filter) */
// export const isKind =
//   <E extends WithKind, K extends E['kind']>(...kinds: readonly K[]) =>
//   (e: E): e is ByKind<E, K> =>
//     kinds.includes(e.kind as K);

/**
 * Event event-bus helpers.
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

/**
 * Common filters for the event-bus.
 */
export type EventBusFilterLib = {
  // crdt:
};

// import { Rx } from './common.ts';
// const m = Rx.filter((e) => e.kind.startsWith('editor:crdt:'))
