import type { t } from './common.ts';

/**
 * Helpers for working with file-system directories.
 */
export type FsDirLib = {
  /** Tools for working hashes of a file-system directory. */
  readonly Hash: t.DirHashLib;

  /** Create a snapshot of the specified directory. */
  snapshot(args: FsDirSnapshotArgs): Promise<DirSnapshot>;
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
