import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Internal graph document shape: a read-only snapshot of the current value.
 *
 * This is intentionally minimal (`{ current: T }`), allowing documents to be
 * backed by document refs, command-based loaders, or any other immutable source.
 */
type GraphDoc<T extends O = O> = t.ImmutableSnapshot<T>;

/**
 * Provides a generic DAG walker for document graphs.
 */
export type GraphLib = {
  readonly walk: GraphWalk;
  readonly default: {
    readonly discoverRefs: t.GraphDiscoverRefs;
  };
};

/**
 * Graph walker entrypoint.
 */
export type GraphWalk = <T extends O = O>(args: GraphWalkArgs<T>) => Promise<GraphWalkResult>;

/**
 * Loader used to resolve documents during a graph walk.
 *
 * Example implementations:
 *  - in-process: `id => repo.get<T>(id)`
 *  - RPC: `id => cmd.send('doc:read', { id }).then(r => r.doc)`
 */
export type GraphLoadDoc<T extends O = O> = (id: t.StringId) => Promise<GraphDoc<T> | undefined>;

/**
 * Common options for walking a document reference DAG.
 */
export type GraphWalkArgsBase<T extends O = O> = {
  readonly id: t.StringId;
  readonly depth?: number;
  readonly processed?: t.StringId[];

  readonly onDoc: (args: GraphWalkDocArgs<T>) => void | Promise<void>;
  readonly onSkip?: (args: GraphWalkSkipArgs) => void;
  readonly onRefs?: (args: GraphWalkRefsArgs) => void;

  /**
   * Optional hook to customize how outbound references are discovered
   * for each document. If omitted the default `Graph.default.discoverRefs` is used.
   */
  readonly discoverRefs?: GraphDiscoverRefs;
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
export type GraphWalkArgs<T extends O = O> = GraphWalkArgsBase<T> & {
  readonly load: GraphLoadDoc<T>;
};

/**
 * Reason a document was skipped during a graph walk.
 */
export type GraphSkipReason = 'already-processed' | 'not-found' | 'not-object';

/**
 * Arguments passed to `onDoc` for each successfully loaded document.
 */
export type GraphWalkDocArgs<T extends O = O> = {
  readonly id: t.StringId;
  readonly doc: GraphDoc<T>;
  readonly depth: number;
};

/**
 * Arguments passed to `onSkip` when a document is not processed.
 */
export type GraphWalkSkipArgs = {
  readonly id: t.StringId;
  readonly depth: number;
  readonly reason: GraphSkipReason;
};

/**
 * Arguments passed to `onRefs` for discovered outbound references.
 */
export type GraphWalkRefsArgs = {
  readonly id: t.StringId;
  readonly depth: number;
  readonly refs: readonly t.StringId[];
};

/**
 * Arguments passed to `discoverRefs` for computing outbound edges from a doc.
 */
export type GraphDiscoverRefsArgs = {
  readonly id: t.StringId;
  readonly doc: GraphDoc;
  readonly depth: number;
};

/**
 * Optional hook to customize how outbound references are discovered
 * from a given document.
 *
 * Return zero or more ids (sync or async). The walker will treat
 * these as the DAG edges for that document.
 */
export type GraphDiscoverRefs = (
  args: GraphDiscoverRefsArgs,
) => Promise<t.Ary<t.StringId>> | t.Ary<t.StringId>;

/**
 * Result of a graph walk.
 */
export type GraphWalkResult = {
  readonly processed: readonly t.StringId[];
};
