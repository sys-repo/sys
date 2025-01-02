import type { t } from './common.ts';

/**
 * Helpers for performing glob searches over a file-system.
 */
export type GlobLib = {
  /** Generate a Glob helper scoped to a path. */
  readonly create: t.GlobFactory;

  /** List the file-paths within a directory (simple glob). */
  readonly ls: t.GlobPathList;
};

/**
 * Generate a Glob helper scoped to a path.
 */
export type GlobFactory = (dir: t.StringDir, options?: GlobOptions) => t.Glob;

/**
 * Runs globs against a filesystem root.
 */
export type Glob = {
  /** Read out the base directory. */
  readonly base: t.StringDir;

  /** Query the given glob pattern. */
  find(pattern: string, options?: t.GlobOptions): Promise<t.WalkEntry[]>;

  /** Retrieve a sub-directory `Glob` from the current context. */
  dir(subdir: t.StringDir): Glob;
};

/** Options for a glob operation.  */
export type GlobOptions = {
  exclude?: string[];
  includeDirs?: boolean;
};

/**
 * List the file-paths within a directory (simple glob).
 */
export type GlobPathList = (dir: t.StringDir, options?: t.GlobOptions) => Promise<t.StringPath[]>;
