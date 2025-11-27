import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * CRDT Graph Utilities
 *
 * Thin facade over the generic immutable graph walker, specialised
 * for CRDT document graphs and a CRDT-flavoured default discoverRefs.
 */
export type CrdtGraphLib = {
  readonly walk: CrdtGraphWalk;
  readonly default: {
    readonly discoverRefs: CrdtGraphDiscoverRefs;
  };
};

/**
 * Loader used when the walker is not bound directly to a repo.
 *
 * Alias of the generic `Graph.LoadDoc` loader shape.
 */
export type CrdtGraphLoadDoc<T extends O = O> = t.Graph.LoadDoc<T>;

/**
 * Common options for walking a CRDT reference DAG.
 *
 * Alias of the generic `Graph.WalkArgsBase` shape.
 */
export type CrdtGraphWalkArgsBase<T extends O = O> = t.Graph.WalkArgsBase<T>;

/**
 * Repo-backed args: the walker will call `repo.get(id)` to load docs
 * using the CRDT repo plus `getWithRetry`.
 */
export type CrdtGraphWalkArgsRepo<T extends O = O> = CrdtGraphWalkArgsBase<T> & {
  readonly repo: t.Crdt.Repo;
};

/**
 * Loader-backed args: the walker will call `load(id)` to load docs.
 */
export type CrdtGraphWalkArgsLoad<T extends O = O> = CrdtGraphWalkArgsBase<T> & {
  readonly load: CrdtGraphLoadDoc<T>;
};

/**
 * Configuration for walking a CRDT reference DAG.
 *
 * Starting from a root id the walker will:
 * - load docs via `repo.get()` (with retry) or `load(id)`
 * - resolve outbound references
 * - prevent cycles using `processed[]`
 * - fire structured callbacks for each phase
 */
export type CrdtGraphWalkArgs<T extends O = O> =
  | CrdtGraphWalkArgsRepo<T>
  | CrdtGraphWalkArgsLoad<T>;

/**
 * Graph walker entrypoint for CRDT documents.
 *
 * This mirrors the generic `Graph.Walk` shape, but is specialised on
 * `CrdtGraphWalkArgs` so the CRDT layer can support both `repo` and `load`.
 */
export type CrdtGraphWalk = <T extends O = O>(
  args: CrdtGraphWalkArgs<T>,
) => Promise<CrdtGraphWalkResult>;

/**
 * Reason a CRDT document was skipped during a graph walk.
 */
export type CrdtGraphSkipReason = t.Graph.SkipReason;

/**
 * Arguments passed to `onDoc` for each successfully loaded document.
 */
export type CrdtGraphWalkDocArgs<T extends O = O> = t.Graph.WalkDocArgs<T>;

/**
 * Arguments passed to `onSkip` when a document is not processed.
 */
export type CrdtGraphWalkSkipArgs = t.Graph.WalkSkipArgs;

/**
 * Arguments passed to `onRefs` for discovered outbound references.
 */
export type CrdtGraphWalkRefsArgs = t.Graph.WalkRefsArgs;

/**
 * Arguments passed to `discoverRefs` for computing outbound edges from a doc.
 */
export type CrdtGraphDiscoverRefsArgs = t.Graph.DiscoverRefsArgs;

/**
 * Optional hook to customise how outbound references are discovered
 * from a given CRDT document.
 *
 * Alias of the generic `Graph.DiscoverRefs` hook.
 */
export type CrdtGraphDiscoverRefs = t.Graph.DiscoverRefs;

/**
 * Result of a CRDT graph walk.
 */
export type CrdtGraphWalkResult = t.Graph.WalkResult;
