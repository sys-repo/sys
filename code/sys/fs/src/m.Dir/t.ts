import type { t } from './common.ts';

/**
 * Helpers for working with file-system directories.
 */
export type FsDirLib = {
  /** Tools for working hashes of a file-system directory. */
  readonly Hash: t.DirHashLib;

  /** Tools for creating directory backup snapshots of a directory. */
  readonly Snapshot: t.FsDirSnapshotLib;

  /** Write a snapshot of the specified directory to disk. */
  readonly snapshot: t.FsDirSnapshotLib['write'];
};
