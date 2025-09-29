import type { t } from './common.ts';

/**
 * Event-bus helpers.
 */
export type EditorBusLib = {
  /** Event filtering tools. */
  readonly Filter: EventBusFilterLib;

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

/**
 * Common filters for the event-bus.
 */
export type EventBusFilterLib = {
  /** e.kind matches any of the given kinds (type guard). */
  isKind: <K extends t.EditorEvent['kind']>(
    ...kinds: readonly K[]
  ) => (e: t.EditorEvent) => e is Extract<t.EditorEvent, { kind: K }>;

  /** e.kind starts with the given prefix (type guard). */
  hasPrefix: <P extends string>(
    prefix: P,
  ) => (e: t.EditorEvent) => e is Extract<t.EditorEvent, { kind: `${P}${string}` }>;

  /** Rx operator: filter by exact kind(s), preserving narrow type. */
  ofKind: <K extends t.EditorEvent['kind']>(
    ...kinds: readonly K[]
  ) => (src: t.Observable<t.EditorEvent>) => t.Observable<Extract<t.EditorEvent, { kind: K }>>;

  /** Rx operator: filter by prefix, preserving narrow type. */
  ofPrefix: <P extends string>(
    prefix: P,
  ) => (
    src: t.Observable<t.EditorEvent>,
  ) => t.Observable<Extract<t.EditorEvent, { kind: `${P}${string}` }>>;
};
