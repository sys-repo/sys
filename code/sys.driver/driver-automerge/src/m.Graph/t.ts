import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * CRDT Graph Utilities
 * Provides a generic DAG walker for CRDT documents.
 *
 * Documents are loaded either via a concrete repo or a custom loader.
 */
export type CrdtGraphLib = {
  readonly walk: CrdtGraphWalk;
  readonly default: {
    readonly discoverRefs: t.CrdtGraphDiscoverRefs;
  };
};

/**
 * Graph walker entrypoint.
 * Generic in `T` for callers that want typed `doc.current`.
 */
export type CrdtGraphWalk = <T extends O = O>(
  args: CrdtGraphWalkArgs<T>,
) => Promise<CrdtGraphWalkResult>;

/**
 * Loader used when the walker is not bound directly to a repo.
 * Example implementations:
 *  - in-process: `id => repo.get<T>(id)`
 *  - RPC: `id => cmd.send('doc:read', { id }).then(r => r.doc)`
 */
export type CrdtGraphLoadDoc<T extends O = O> = (
  id: t.Crdt.Id,
) => Promise<t.Crdt.Ref<T> | undefined>;

/**
 * Common options for walking a CRDT reference DAG.
 */
export type CrdtGraphWalkArgsBase<T extends O = O> = {
  readonly id: t.Crdt.Id;

  readonly depth?: number;
  readonly processed?: t.Crdt.Id[];

  readonly onDoc: (args: CrdtGraphWalkDocArgs<T>) => void | Promise<void>;
  readonly onSkip?: (args: CrdtGraphWalkSkipArgs) => void;
  readonly onRefs?: (args: CrdtGraphWalkRefsArgs) => void;

  /**
   * Optional hook to customize how outbound references are discovered
   * for each document. If omitted, a default implementation scans
   * `doc.current` for CRDT URIs using `CrdtIs`/`CrdtId`.
   */
  readonly discoverRefs?: CrdtGraphDiscoverRefs;
};

/**
 * Repo-backed args: the walker will call `repo.get(id)` to load docs.
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
 * - load docs via `repo.get()` or `load(id)`
 * - resolve outbound references
 * - prevent cycles using `processed[]`
 * - fire structured callbacks for each phase
 */
export type CrdtGraphWalkArgs<T extends O = O> =
  | CrdtGraphWalkArgsRepo<T>
  | CrdtGraphWalkArgsLoad<T>;

/**
 * Reason a CRDT document was skipped during a graph walk.
 */
export type CrdtGraphSkipReason = 'already-processed' | 'not-found' | 'not-object';

/**
 * Arguments passed to `onDoc` for each successfully loaded document.
 */
export type CrdtGraphWalkDocArgs<T extends O = O> = {
  readonly doc: t.Crdt.Ref<T>;
  readonly depth: number;
};

/**
 * Arguments passed to `onSkip` when a document is not processed.
 */
export type CrdtGraphWalkSkipArgs = {
  readonly id: t.Crdt.Id;
  readonly depth: number;
  readonly reason: CrdtGraphSkipReason;
};

/**
 * Arguments passed to `onRefs` for discovered outbound references.
 */
export type CrdtGraphWalkRefsArgs = {
  readonly id: t.Crdt.Id;
  readonly depth: number;
  readonly refs: readonly t.Crdt.Id[];
};

/**
 * Arguments passed to `discoverRefs` for computing outbound edges from a doc.
 */
export type CrdtGraphDiscoverRefsArgs = {
  readonly doc: t.Crdt.Ref;
  readonly depth: number;
};

/**
 * Optional hook to customize how outbound references are discovered
 * from a given document.
 *
 * Return zero or more CRDT ids (sync or async). The walker will treat
 * these as the DAG edges for that document.
 */
export type CrdtGraphDiscoverRefs = (
  args: CrdtGraphDiscoverRefsArgs,
) => Promise<t.Ary<t.Crdt.Id>> | t.Ary<t.Crdt.Id>;

/**
 * Result of a graph walk.
 */
export type CrdtGraphWalkResult = {
  readonly processed: readonly t.Crdt.Id[];
};
