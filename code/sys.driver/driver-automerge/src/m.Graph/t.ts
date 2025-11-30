import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * CRDT Graph Utilities
 *
 * Thin facade over the generic immutable graph walker, specialised
 * for CRDT document graphs and a CRDT-flavoured default discoverRefs.
 */
export type CrdtGraphLib = {
  /**
   * Graph walker entrypoint for CRDT documents.
   *
   * Supports both:
   * - repo-backed usage (`repo`), and
   * - loader-backed usage (`load`).
   */
  readonly walk: CrdtGraphWalk;

  /**
   * Materialize a full DAG structure from a root id (nodes + edges),
   * using the same CRDT-aware loading behaviour as `walk`.
   * - `build`: materialize a DAG from a root id
   * - `index`: derive a fast id → node lookup map.
   * - `forEach`: iterate nodes in the stored order.
   */
  readonly Dag: {
    build: CrdtGraphDag;
    index: t.Graph.Dag.Index;
    forEach: t.Graph.Dag.ForEach;
    forEachAsync: t.Graph.Dag.ForEachAsync;
  };

  /**
   * Default helpers (e.g. CRDT-flavoured outbound-reference discovery).
   */
  readonly default: {
    readonly discoverRefs: t.Graph.DiscoverRefs;
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
 * Specialised on `CrdtGraphWalkArgs` so the CRDT layer can support
 * both repo-backed and loader-backed usage, while still returning
 * the generic `Graph.WalkResult`.
 */
export type CrdtGraphWalk = <T extends O = O>(
  args: CrdtGraphWalkArgs<T>,
) => Promise<t.Graph.WalkResult>;

/**
 * Base options for building a CRDT DAG.
 *
 * Mirrors the generic `Graph.Dag.BuildArgs<T>` shape but uses
 * the CRDT-specific loader layer (repo | load).
 */
export type CrdtGraphDagArgsBase<T extends O = O> = {
  readonly id: t.StringId;
  readonly depth?: number;
  readonly processed?: t.StringId[];
  readonly discoverRefs?: t.Graph.DiscoverRefs;

  /**
   * Include nodes that were only ever seen via `onSkip`
   * (e.g. not-found, already-processed) in the `nodes` list.
   *
   * Default: false.
   */
  readonly includeSkipped?: boolean;
};

/**
 * Repo-backed args for DAG materialisation.
 */
export type CrdtGraphDagArgsRepo<T extends O = O> = CrdtGraphDagArgsBase<T> & {
  readonly repo: t.Crdt.Repo;
};

/**
 * Loader-backed args for DAG materialisation.
 */
export type CrdtGraphDagArgsLoad<T extends O = O> = CrdtGraphDagArgsBase<T> & {
  readonly load: CrdtGraphLoadDoc<T>;
};

/**
 * Arguments for building a CRDT DAG via the generic immutable DAG builder.
 *
 * Repo-backed and loader-backed variants, matching `CrdtGraphWalkArgs<T>`
 * but without the low-level callbacks.
 */
export type CrdtGraphDagArgs<T extends O = O> = CrdtGraphDagArgsRepo<T> | CrdtGraphDagArgsLoad<T>;

/**
 * CRDT DAG builder: thin adapter over `Graph.dag`, using the same
 * repo/load normalisation as `CrdtGraphWalk`.
 */
export type CrdtGraphDag = <T extends O = O>(
  args: CrdtGraphDagArgs<T>,
) => Promise<t.Graph.Dag.Result<T>>;
