import type { t } from './common.ts';

/**
 * Tools for creating directory backup snapshots of a directory.
 */
export type FsDirSnapshotLib = {
  /** Write a snapshot of the specified directory to disk. */
  write(args: t.FsDirSnapshotArgs): Promise<t.DirSnapshot>;
};

/** Arguments passed to the `Dir.snapshot` method. */
export type FsDirSnapshotArgs = {
  source: t.StringDir;
  target: t.StringDir;
  filter?: t.FsPathFilter;
  throw?: boolean;
};

/**
 * A backup snapshot
 */
export type DirSnapshot = {
  id: string;
  timestamp: number;
  hx: t.CompositeHash;
  path: { source: t.StringAbsoluteDir; target: t.StringAbsoluteDir };
  error?: t.StdError;
};
