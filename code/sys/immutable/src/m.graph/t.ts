import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Generic DAG walker for document graphs.
 */
export type GraphLib = {
  readonly walk: t.Graph.Walk;
  readonly default: { readonly discoverRefs: t.Graph.DiscoverRefs };
};

/**
 * Generic DAG walker for document graphs.
 */
export namespace Graph {
  /**
   * Internal graph document shape: a read-only snapshot of the current value.
   *
   * This is intentionally minimal (`{ current: T }`), allowing documents to be
   * backed by document refs, command-based loaders, or any other immutable source.
   */
  type Doc<T extends O = O> = t.ImmutableSnapshot<T>;

  /**
   * Graph walker entrypoint.
   */
  export type Walk = <T extends O = O>(args: WalkArgs<T>) => Promise<WalkResult>;

  /**
   * Loader used to resolve documents during a graph walk.
   *
   * Example implementations:
   *  - in-process: `id => repo.get<T>(id)`
   *  - RPC: `id => cmd.send('doc:read', { id }).then(r => r.doc)`
   */
  export type LoadDoc<T extends O = O> = (id: t.StringId) => Promise<Doc<T> | undefined>;

  /**
   * Common options for walking a document reference DAG.
   */
  export type WalkArgsBase<T extends O = O> = {
    readonly id: t.StringId;
    readonly depth?: number;
    readonly processed?: t.StringId[];

    readonly onDoc: (args: WalkDocArgs<T>) => void | Promise<void>;
    readonly onSkip?: (args: WalkSkipArgs) => void;
    readonly onRefs?: (args: WalkRefsArgs) => void;

    /**
     * Optional hook to customize how outbound references are discovered
     * for each document. If omitted the default `Graph.default.discoverRefs` is used.
     */
    readonly discoverRefs?: DiscoverRefs;
  };

  /**
   * Configuration for walking a document-reference DAG.
   *
   * Starting from a root id the walker will:
   * - load docs via the caller-supplied `load(id)`
   * - resolve outbound references
   * - prevent cycles using `processed[]`
   * - fire structured callbacks for each phase
   */
  export type WalkArgs<T extends O = O> = WalkArgsBase<T> & {
    readonly load: LoadDoc<T>;
  };

  /**
   * Reason a document was skipped during a graph walk.
   */
  export type SkipReason = 'already-processed' | 'not-found' | 'not-object';

  /**
   * Arguments passed to `onDoc` for each successfully loaded document.
   */
  export type WalkDocArgs<T extends O = O> = {
    readonly id: t.StringId;
    readonly doc: Doc<T>;
    readonly depth: number;
  };

  /**
   * Arguments passed to `onSkip` when a document is not processed.
   */
  export type WalkSkipArgs = {
    readonly id: t.StringId;
    readonly depth: number;
    readonly reason: SkipReason;
  };

  /**
   * Arguments passed to `onRefs` for discovered outbound references.
   */
  export type WalkRefsArgs = {
    readonly id: t.StringId;
    readonly depth: number;
    readonly refs: readonly t.StringId[];
  };

  /**
   * Arguments passed to `discoverRefs` for computing outbound edges from a doc.
   */
  export type DiscoverRefsArgs = {
    readonly id: t.StringId;
    readonly doc: Doc;
    readonly depth: number;
  };

  /**
   * Optional hook to customize how outbound references are discovered
   * from a given document.
   *
   * Return zero or more ids (sync or async). The walker will treat
   * these as the DAG edges for that document.
   */
  export type DiscoverRefs = (
    args: DiscoverRefsArgs,
  ) => Promise<t.Ary<t.StringId>> | t.Ary<t.StringId>;

  /**
   * Result of a graph walk.
   */
  export type WalkResult = {
    readonly processed: readonly t.StringId[];
  };
}
