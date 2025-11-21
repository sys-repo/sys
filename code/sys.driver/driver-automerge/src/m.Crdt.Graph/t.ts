import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * CRDT Graph Utilities
 * Provides a generic, repo-backed DAG walker for CRDT documents.
 */
export type CrdtGraphLib = {
  readonly walk: CrdtGraphWalk;
};

/**
 * Reason a CRDT document was skipped during a graph walk.
 */
export type CrdtGraphSkipReason = 'already-processed' | 'not-found' | 'not-object';

/**
 * Arguments passed to `onDoc` for each successfully loaded document.
 */
export type CrdtGraphWalkOnDocArgs<T extends O = O> = {
  readonly id: t.Crdt.Id;
  readonly depth: number;
  readonly doc: t.Crdt.Ref<T>;
};

/**
 * Arguments passed to `onSkip` when a document is not processed.
 */
export type CrdtGraphWalkOnSkipArgs = {
  readonly id: t.Crdt.Id;
  readonly depth: number;
  readonly reason: CrdtGraphSkipReason;
};

/**
 * Arguments passed to `onRefs` for discovered outbound references.
 */
export type CrdtGraphWalkOnRefsArgs = {
  readonly id: t.Crdt.Id;
  readonly depth: number;
  readonly refs: readonly t.Crdt.Id[];
};

/**
 * Configuration for walking a CRDT reference DAG.
 *
 * Starting from a root id:
 * - loads docs via `repo.get()`
 * - resolves outbound `crdt:` references
 * - prevents cycles using `processed[]`
 * - fires structured callbacks for each phase
 */
export type CrdtGraphWalkArgs<T extends O = O> = {
  readonly repo: t.Crdt.Repo;
  readonly id: t.Crdt.Id;

  readonly depth?: number;
  readonly processed?: t.Crdt.Id[];

  readonly onDoc: (args: CrdtGraphWalkOnDocArgs<T>) => void | Promise<void>;
  readonly onSkip?: (args: CrdtGraphWalkOnSkipArgs) => void;
  readonly onRefs?: (args: CrdtGraphWalkOnRefsArgs) => void;
};

/**
 * Result of a graph walk.
 */
export type CrdtGraphWalkResult = {
  readonly processed: readonly t.Crdt.Id[];
};

/**
 * Graph walker entrypoint.
 *
 * Generic in `T` for callers that want typed `doc.current`.
 */
export type CrdtGraphWalk = <T extends O = O>(
  args: CrdtGraphWalkArgs<T>,
) => Promise<CrdtGraphWalkResult>;
