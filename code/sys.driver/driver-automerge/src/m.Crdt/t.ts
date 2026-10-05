import type { Mark as AMMark, MarkRange as AMMarkRange } from '@automerge/automerge';
import type { t } from './common.ts';
import type * as TCore from './t.core.ts';
import type * as TDocumentId from '../ui/ui.DocumentId/t.ts';
import type * as TId from './t.Id.ts';
import type * as TIs from './t.Is.ts';
import type * as TMeta from './t.meta.ts';
import type * as TNetwork from './t.network.ts';
import type * as TStr from './t.Str.ts';

type O = Record<string, unknown>;

/**
 * Core CRDT contracts.
 */
export declare namespace Crdt {
  /** Common root API to the CRDT library. */
  export type Lib = {
    /** CRDT predicate helpers. */
    readonly Is: TIs.Lib;
    /** CRDT identifier helpers. */
    readonly Id: TId.Lib;
    /** CRDT URL helpers. */
    readonly Url: { ws(input?: string): t.StringUrl };
    /** CRDT string formatting helpers. */
    readonly Str: TStr.Lib;
    /** CRDT command helpers. */
    readonly Cmd: t.CrdtCmdLib;
    /** CRDT worker helpers. */
    readonly Worker: t.CrdtWorkerLib;
    /** CRDT graph traversal helpers. */
    readonly Graph: t.CrdtGraph.Lib;
    /** Wait for a document ref to become ready. */
    whenReady(doc?: Ref): Promise<void>;
    /** Convert Automerge-backed refs into plain objects. */
    toObject: ToObject;
  };

  /** Automerge repo handle. */
  export type Repo = t.CrdtRepo;
  /** Automerge document ref. */
  export type Ref<T extends O = O> = t.CrdtRef<T>;
  /** Result from loading or creating a document ref. */
  export type RefResult<T extends O = O> = t.CrdtRefResult<T>;
  /** CRDT document id string. */
  export type Id = t.StringId;
  /** Change events emitted by a CRDT document ref. */
  export type Events<T extends O = O> = t.CrdtEvents<T>;
  /** Automerge patch payload. */
  export type Patch = t.CrdtPatch;
  /** Automerge text splice payload. */
  export type Splice = TCore.Splice;
  /** Plain-object converter for CRDT refs. */
  export type ToObject = TCore.ToObject;
  /** System metadata stored alongside CRDT documents. */
  export type SysMeta = TMeta.Sys;

  /** Document-id UI contracts. */
  export namespace DocumentId {
    /** Document-id UI component API. */
    export type Lib = TDocumentId.DocumentId.Lib;
    /** Document-id component props. */
    export type Props = TDocumentId.DocumentId.Props;

    /** Document-id action contracts. */
    export namespace Action {
      /** Document-id action name. */
      export type Name = TDocumentId.DocumentId.Action.Name;
      /** Document-id action event payload. */
      export type Args = TDocumentId.DocumentId.Action.Args;
      /** Document-id action handler. */
      export type Handler = TDocumentId.DocumentId.Action.Handler;
    }

    /** Document-id event contracts. */
    export namespace Event {
      /** Handler invoked when the document-id controller is ready. */
      export type ReadyHandler = TDocumentId.DocumentId.Event.ReadyHandler;
      /** Handler invoked when the document-id value changes. */
      export type ChangedHandler = TDocumentId.DocumentId.Event.ChangedHandler;
      /** Document-id changed event payload. */
      export type Changed = TDocumentId.DocumentId.Event.Changed;
    }

    /** Document-id URL factory contracts. */
    export namespace Url {
      /** URL factory for document-id copy actions. */
      export type Factory = TDocumentId.DocumentId.Url.Factory;
      /** Arguments passed to a document-id URL factory. */
      export type FactoryArgs = TDocumentId.DocumentId.Url.FactoryArgs;
    }

    /** Document-id controller hook contracts. */
    export namespace Hook {
      /** Controller hook factory. */
      export type Use = TDocumentId.DocumentId.Hook.Use;
      /** Controller hook arguments. */
      export type Args<T = Record<string, unknown>> = TDocumentId.DocumentId.Hook.Args<T>;
      /** Controller hook instance. */
      export type Instance = TDocumentId.DocumentId.Hook.Instance;
      /** Derived component props from the controller hook. */
      export type Props = TDocumentId.DocumentId.Hook.Props;
      /** Signal bundle used by the controller hook. */
      export type Signals = TDocumentId.DocumentId.Hook.Signals;
      /** Snapshot of controller signal values. */
      export type SignalValues = TDocumentId.DocumentId.Hook.SignalValues;
    }

    /** Document-id parser contracts. */
    export namespace Parse {
      /** Document-id textbox parser API. */
      export type Lib = TDocumentId.DocumentId.Parse.Lib;
      /** Parsed document-id textbox result. */
      export type Result = TDocumentId.DocumentId.Parse.Result;
    }
  }

  /**
   * CRDT network argument contracts.
   */
  export namespace Network {
    /** WebSocket endpoint descriptor for Automerge repository sync. */
    export type WebsocketEndpoint = TNetwork.WebsocketEndpoint;
    /** WebSocket endpoint input accepted by repository sync setup. */
    export type WebsocketArg = TNetwork.WebsocketArg;
  }

  /**
   * Automerge mark contracts.
   */
  export namespace Marks {
    /** Automerge mark descriptor. */
    export type Mark = AMMark;
    /** Automerge mark range descriptor. */
    export type Range = AMMarkRange;
  }

  /**
   * CRDT worker contracts.
   */
  export namespace Worker {
    /** Worker initialization configuration. */
    export type Config = t.CrdtWorkerConfig;
    /** Browser-worker initialization configuration. */
    export type ConfigWeb = t.CrdtWorkerConfigWeb;
    /** Filesystem-worker initialization configuration. */
    export type ConfigFs = t.CrdtWorkerConfigFs;
  }

  /**
   * CRDT command contracts.
   */
  export namespace Cmd {
    /** Factory for creating a command client from a transport. */
    export type Factory = t.CrdtCmdFactory;
    /** Typed CRDT command client API. */
    export type Client = t.CrdtCmdClient;
  }

  /**
   * CRDT sync contracts.
   */
  export namespace Sync {
    /** Sync server instance contract. */
    export type Server = t.SyncServer.Instance;
  }

  /**
   * CRDT graph convenience aliases.
   */
  export namespace Graph {
    /** Function that discovers document references from a loaded document. */
    export type DiscoverRefs = t.Graph.DiscoverRefs;
    /** Function that loads a graph document by id. */
    export type LoadDoc<T extends O = O> = t.Graph.LoadDoc<T>;
    /** Arguments for walking a CRDT document graph. */
    export type WalkDocArgs<T extends O = O> = t.Graph.WalkDocArgs<T>;
    /** Arguments for walking references discovered in a document. */
    export type WalkRefsArgs = t.Graph.WalkRefsArgs;
    /** Arguments supplied when deciding whether to skip a graph edge. */
    export type WalkSkipArgs = t.Graph.WalkSkipArgs;
    /** Node in a discovered CRDT document graph. */
    export type Node<T extends O = O> = t.Graph.Node<T>;
    /** Edge between documents in a discovered CRDT graph. */
    export type Edge = t.Graph.Edge;
  }
}
