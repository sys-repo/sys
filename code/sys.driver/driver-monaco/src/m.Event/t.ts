import type { t } from './common.ts';
import type * as TEvent from './t.event-defs.ts';

/**
 * Event-bus helpers.
 */
export declare namespace EditorBus {
  /** Runtime library surface. */
  export type Lib = {
    /** Event filtering tools. */
    readonly Filter: Filter;

    /** Generate a new event-bus subject. */
    make(): Subject;

    /** Emit an event to the bus on a chosen async-schedule. */
    emit: t.EmitEvent<t.EditorEvent.Shape>;

    /** Emit a `editor:ping` event. */
    ping(
      bus$: Subject,
      request: readonly t.EditorEvent.Ping.Kind[],
      nonce?: string,
      editorId?: t.StringId,
    ): t.EditorEvent.Ping.Request;

    /** Emit a `editor:pong` event. */
    pong(
      bus$: Subject,
      nonce: string,
      states: readonly t.EditorEvent.Ping.Kind[],
    ): t.EditorEvent.Ping.Response;
  };

  /** Editor event-bus subject. */
  export type Subject = t.Subject<t.EditorEvent.Shape>;

  /** Editor events observable. */
  export type Observable = t.Observable<t.EditorEvent.Shape>;

  /** Event filtering on editor events. */
  export type Filter = t.EventFilterLib<t.EditorEvent.Shape>;
}

/**
 * Events running within the editor runtime environment.
 */
export declare namespace EditorEvent {
  /** Editor event union. */
  export type Shape = TEvent.Shape;

  /** Generic debug event. */
  export type Debug = TEvent.Debug;

  /** CRDT/editor events. */
  export namespace Crdt {
    export type Shape = TEvent.CrdtShape;
    export type Text = TEvent.CrdtText;
    export type Marks = TEvent.CrdtMarks;
    export type FoldingShape = TEvent.CrdtFoldingShape;
    export type FoldingReady = TEvent.CrdtFoldingReady;
    export type Folding = TEvent.CrdtFolding;
  }

  /** YAML editor events. */
  export namespace Yaml {
    export type Shape = TEvent.YamlShape;
    export type Data = TEvent.YamlData;
    export type Cursor = TEvent.YamlCursor;
  }

  /** Ping/pong request events. */
  export namespace Ping {
    export type Kind = TEvent.PingKind;
    export type Request = TEvent.PingRequest;
    export type Response = TEvent.PingResponse;
  }
}
