import type { t } from './common.ts';
export type * from './t.event-defs.ts';

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

  /** Emit a `editor:ping` event. */
  ping(
    bus$: t.EditorEventBus,
    request: readonly t.EditorPingKind[],
    nonce: string,
    editorId?: t.StringId,
  ): t.EventEditorPing;

  /** Emit a `editor:pong` event. */
  pong(
    bus$: t.EditorEventBus,
    nonce: string,
    states: readonly t.EditorPingKind[],
  ): t.EventEditorPong;
};
