import type { t } from './common.ts';

/**
 * Helpers for working with file-system directories.
 */
export type FsDirLib = {
  /** Create a snapshot of the specified directory. */
  snapshot(args: FsDirSnapshotArgs): Promise<DirSnapshot>;
};

/** Arguments passed to the `Dir.snapshot` method. */
export type FsDirSnapshotArgs = {
  source: t.StringDir;
  target: t.StringDir;
  filter?: t.FsCopyFilter;
};

/**
 * A backup snapshot
 */
export type DirSnapshot = {
  id: string;
  timestamp: number;
  path: { source: t.StringDir; target: t.StringDir };
  copied: t.StringPath[];
  error?: t.StdError;
};
