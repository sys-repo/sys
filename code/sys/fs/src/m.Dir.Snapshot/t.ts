import type { t } from './common.ts';

/**
 * Tools for creating directory backup snapshots of a directory.
 */
export type FsDirSnapshotLib = {
  /** Helpers for emitting snapshot details to the console log. */
  readonly Fmt: t.DirSnapshotFmtLib;

  /** Write a snapshot of the specified directory to disk. */
  write(args: t.FsDirSnapshotArgs): Promise<t.DirSnapshot>;
};

/** Arguments passed to the `Dir.snapshot` method. */
export type FsDirSnapshotArgs = {
  source: t.StringDir;
  target: t.StringDir;

  /** Filter function to narrow down the paths included in the snapshot. */
  filter?: t.FsPathFilter;

  /** Augment the snapshot meta with a "commit" style messagae. */
  message?: string;

  /** Throw when encountering an error (default:false). */
  throw?: boolean;

  /** Force the snapshot even if an existing shaoshot hash exists (default: false). */
  force?: boolean;
};

/**
 * A directory-snapshot.
 */
export type DirSnapshot = {
  readonly id: string;
  readonly timestamp: number;
  readonly hx: t.CompositeHash;
  readonly path: t.DirSnapshotPaths;
  readonly is: { readonly ref: boolean };
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
  ref?: true;
  message?: string;
  hx: t.CompositeHash;
};

/**
 * Helpers for emitting snapshot details to the console log.
 */
export type DirSnapshotFmtLib = {
  log(snapshot: t.DirSnapshot, options?: t.DirSnapshotFmtOptions): Promise<void>;
  toString(snapshot: t.DirSnapshot, options?: t.DirSnapshotFmtOptions): Promise<string>;
};

/** Options passed to `Dir.Snapshot.Fmt` methods. */
export type DirSnapshotFmtOptions = { title?: string };
