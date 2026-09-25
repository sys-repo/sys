import type { t } from './common.ts';

/**
 * Helpers for performing glob searches over a file-system.
 */
export declare namespace Glob {
  /** Glob helper library. */
  export type Lib = {
    /** Generate a Glob helper scoped to a path. */
    readonly create: Factory;

    /** List the file-paths within a directory (simple glob). */
    readonly ls: PathList;
  };

  /** Generate a Glob helper scoped to a path. */
  export type Factory = (dir?: t.StringDir, options?: Options) => Instance;

  /** Runs globs against a filesystem root. */
  export type Instance = {
    /** Read out the base directory. */
    readonly base: t.StringDir;

    /** Query the given glob pattern. */
    find(pattern: string, options?: Options): Promise<t.WalkEntry[]>;

    /** Retrieve a sub-directory `Glob` from the current context. */
    dir(subdir: t.StringDir, options?: Options): Instance;
  };

  /** Options for a glob operation. */
  export type Options = {
    exclude?: t.Ary<string>;
    includeDirs?: boolean;
    trimCwd?: boolean;
    depth?: number;
  };

  /** List the file-paths within a directory (simple glob). */
  export type PathList = (dir: t.StringDir, options?: Options) => Promise<t.StringPath[]>;
}
