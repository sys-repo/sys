import type { t } from '../common.ts';

/**
 * "start" event: snapshot run is beginning.
 */
export type CrdtSnapshotProgressStart = {
  readonly kind: 'start';
  readonly rootId: t.StringId;
  readonly dir: t.StringDir;
  readonly timestamp: t.UnixTimestamp;
};

/**
 * "doc:skip" event: document was not processed for a specific reason.
 */
export type CrdtSnapshotProgressSkip = {
  readonly kind: 'doc:skip';
  readonly id: t.StringId;
  readonly reason: 'already-processed' | 'not-found' | 'not-object';
};

/**
 * "doc:saved" event: document snapshot written to disk.
 */
export type CrdtSnapshotProgressSaved = {
  readonly kind: 'doc:saved';
  readonly id: t.StringId;
  readonly depth: number;
  readonly dir: t.StringDir;
  readonly filename: string;
  readonly path: t.StringPath;
  readonly bytes: { json: number; binary: number };
  readonly hash: t.StringHash;
  readonly isRoot: boolean;
};

/**
 * "doc:refs" event: references discovered within a document.
 */
export type CrdtSnapshotProgressRefs = {
  readonly kind: 'doc:refs';
  readonly id: t.StringId;
  readonly refs: readonly t.StringId[];
};

/**
 * "complete" event: snapshot run finished.
 */
export type CrdtSnapshotProgressComplete = {
  readonly kind: 'complete';
  readonly rootId: t.StringId;
  readonly dir: t.StringDir;
  readonly processed: readonly t.StringId[];
};

/**
 * Progress events emitted while walking the CRDT reference tree.
 */
export type CrdtSnapshotProgress =
  | CrdtSnapshotProgressStart
  | CrdtSnapshotProgressSkip
  | CrdtSnapshotProgressSaved
  | CrdtSnapshotProgressRefs
  | CrdtSnapshotProgressComplete;
