import type { t } from './common.ts';
export type * from './t.events.ts';

/** Editor event-bus (Subject). */
export type EditorEventBus = t.Subject<t.EditorEvent>;

/** Editor events observable. */
export type EditorEventObservable = t.Observable<t.EditorEvent>;

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
  /** Emit an event to the bus on a chosen async-schedule. */
  emit: t.EmitEvent<t.EditorEvent>;

  /** Create or reuse a singleton producer keyed by `key`, with refcounted teardown. */
  singleton<K, P extends { dispose(): void }>(
    registry: Map<K, { refCount: number; producer: P }>,
    key: K,
    create: () => P,
    until?: t.UntilInput,
  ): { producer: P; dispose: () => void };
};
