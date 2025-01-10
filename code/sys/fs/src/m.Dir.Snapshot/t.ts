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
  /** Force the snapshot even if an existing shaoshot hash exists (default: false). */
  force?: boolean;
  throw?: boolean;
};

/**
 * A directory-snapshot.
 */
export type DirSnapshot = {
  readonly id: string;
  readonly timestamp: number;
  readonly hx: t.CompositeHash;
  readonly path: t.DirSnapshotPaths;
  readonly is: { readonly backref: boolean };
  readonly error?: t.StdError;
};

/** Paths related to a directory-snapshot. */
export type DirSnapshotPaths = {
  readonly source: t.StringAbsoluteDir;
  readonly target: {
    readonly root: t.StringAbsoluteDir;
    readonly files: t.StringAbsoluteDir;
    readonly meta: t.StringAbsolutePath;
  };
};

/**
 * Metadata about a directory-snapshot (stored in the root as .json).
 */
export type DirSnapshotMeta = {
  readonly hx: t.CompositeHash;
  readonly is: { readonly backref: boolean };
};
