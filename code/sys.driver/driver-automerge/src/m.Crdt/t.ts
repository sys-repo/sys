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
    readonly Is: TIs.Lib;
    readonly Id: TId.Lib;
    readonly Url: { ws(input?: string): t.StringUrl };
    readonly Str: TStr.Lib;
    readonly Cmd: t.CrdtCmdLib;
    readonly Worker: t.CrdtWorkerLib;
    readonly Graph: t.CrdtGraph.Lib;
    whenReady(doc?: Ref): Promise<void>;
    toObject: ToObject;
  };

  export type Repo = t.CrdtRepo;
  export type Ref<T extends O = O> = t.CrdtRef<T>;
  export type RefResult<T extends O = O> = t.CrdtRefResult<T>;
  export type Id = t.StringId;
  export type Events<T extends O = O> = t.CrdtEvents<T>;
  export type Patch = t.CrdtPatch;
  export type Splice = TCore.Splice;
  export type ToObject = TCore.ToObject;
  export type SysMeta = TMeta.Sys;

  /** Document-id UI contracts. */
  export namespace DocumentId {
    export type Lib = TDocumentId.DocumentId.Lib;
    export type Props = TDocumentId.DocumentId.Props;

    export namespace Action {
      export type Name = TDocumentId.DocumentId.Action.Name;
      export type Args = TDocumentId.DocumentId.Action.Args;
      export type Handler = TDocumentId.DocumentId.Action.Handler;
    }

    export namespace Event {
      export type ReadyHandler = TDocumentId.DocumentId.Event.ReadyHandler;
      export type ChangedHandler = TDocumentId.DocumentId.Event.ChangedHandler;
      export type Changed = TDocumentId.DocumentId.Event.Changed;
    }

    export namespace Url {
      export type Factory = TDocumentId.DocumentId.Url.Factory;
      export type FactoryArgs = TDocumentId.DocumentId.Url.FactoryArgs;
    }

    export namespace Hook {
      export type Use = TDocumentId.DocumentId.Hook.Use;
      export type Args<T = Record<string, unknown>> = TDocumentId.DocumentId.Hook.Args<T>;
      export type Instance = TDocumentId.DocumentId.Hook.Instance;
      export type Props = TDocumentId.DocumentId.Hook.Props;
      export type Signals = TDocumentId.DocumentId.Hook.Signals;
      export type SignalValues = TDocumentId.DocumentId.Hook.SignalValues;
    }

    export namespace Parse {
      export type Lib = TDocumentId.DocumentId.Parse.Lib;
      export type Result = TDocumentId.DocumentId.Parse.Result;
    }
  }

  /**
   * CRDT network argument contracts.
   */
  export namespace Network {
    export type WebsocketEndpoint = TNetwork.WebsocketEndpoint;
    export type WebsocketArg = TNetwork.WebsocketArg;
  }

  /**
   * Automerge mark contracts.
   */
  export namespace Marks {
    export type Mark = AMMark;
    export type Range = AMMarkRange;
  }

  /**
   * CRDT worker contracts.
   */
  export namespace Worker {
    export type Config = t.CrdtWorkerConfig;
    export type ConfigWeb = t.CrdtWorkerConfigWeb;
    export type ConfigFs = t.CrdtWorkerConfigFs;
  }

  /**
   * CRDT command contracts.
   */
  export namespace Cmd {
    export type Factory = t.CrdtCmdFactory;
    export type Client = t.CrdtCmdClient;
  }

  /**
   * CRDT sync contracts.
   */
  export namespace Sync {
    export type Server = t.SyncServer.Instance;
  }

  /**
   * CRDT graph convenience aliases.
   */
  export namespace Graph {
    export type DiscoverRefs = t.Graph.DiscoverRefs;
    export type LoadDoc<T extends O = O> = t.Graph.LoadDoc<T>;
    export type WalkDocArgs<T extends O = O> = t.Graph.WalkDocArgs<T>;
    export type WalkRefsArgs = t.Graph.WalkRefsArgs;
    export type WalkSkipArgs = t.Graph.WalkSkipArgs;
    export type Node<T extends O = O> = t.Graph.Node<T>;
    export type Edge = t.Graph.Edge;
  }
}
