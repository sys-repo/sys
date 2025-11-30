import type { Mark as AMMark, MarkRange as AMMarkRange } from '@automerge/automerge';
import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Core CRDT type namespace.
 */
export namespace Crdt {
  export type Repo = t.CrdtRepo;
  export type Ref<T extends O = O> = t.CrdtRef<T>;
  export type RefResult<T extends O = O> = t.CrdtRefResult<T>;
  export type Id = t.StringId;
  export type Events<T extends O = O> = t.CrdtEvents<T>;
  export type Patch = t.CrdtPatch;
  export type Splice = t.CrdtStringSplice;
  export namespace Marks {
    export type Mark = AMMark;
    export type Range = AMMarkRange;
  }
  export namespace Worker {
    export type Config = t.CrdtWorkerConfig;
    export type ConfigWeb = t.CrdtWorkerConfigWeb;
    export type ConfigFs = t.CrdtWorkerConfigFs;
  }
  export namespace Cmd {
    export type Factory = t.CrdtCmdFactory;
    export type Client = t.CrdtCmdClient;
  }
  export namespace Sync {
    export type Server = t.SyncServer;
  }

  export namespace Graph {
    /**
     * CRDT-flavoured outbound-reference discovery function.
     * This uses the generic graph DiscoverRefs shape, with a CRDT-specific
     * default implementation provided elsewhere.
     */
    export type DiscoverRefs = t.Graph.DiscoverRefs;

    /** Loader used when walking CRDT graphs without a repo. */
    export type LoadDoc<T extends O = O> = t.Graph.LoadDoc<T>;

    /**
     * Pure generic graph walker callback types re-exported for convenience.
     */
    export type WalkDocArgs<T extends O = O> = t.Graph.WalkDocArgs<T>;
    export type WalkRefsArgs = t.Graph.WalkRefsArgs;
    export type WalkSkipArgs = t.Graph.WalkSkipArgs;
  }
}

/**
 * Crdt user-interface namespace.
 */
export namespace CrdtView {
  export type LayoutBindings = t.LayoutBindings;
  export type LayoutHeader = t.LayoutHeader;
  export type LayoutProps = t.LayoutProps;
  export type LayoutSidebar = t.LayoutSidebar;
  export type LayoutSignals = t.LayoutSignals;
  export type LayoutSlots = t.LayoutSlots;
  export type LayoutSpinning = t.LayoutSpinning;

  export type DocumentIdProps = t.DocumentIdProps;
  export type CardProps = t.CardProps;
  export type ObjectViewProps = t.CrdtObjectViewProps;

  export namespace Repo {
    export type SyncSwitchProps = t.RepoSyncSwitchProps;
    export type InfoProps = t.RepoInfoProps;
  }

  export type BinaryFileProps = t.BinaryFileProps;
  export type BinaryFileMap = t.BinaryFileMap;
}
