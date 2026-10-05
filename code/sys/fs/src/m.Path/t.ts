import type { t } from './common.ts';

/**
 * Filesystem-aware path helpers.
 */
export declare namespace FsPath {
  /** Filesystem-aware path API. */
  export type Lib = t.Path.Lib & {
    /** Convert the path to its parent directory if it is not already a directory target. */
    asDir(path: t.StringPath): Promise<t.StringPath>;

    /** Removes the CWD (current-working-directory) from the given path if it exists. */
    trimCwd(path: t.StringPath, options?: TrimCwdOptions | boolean): t.StringPath;

    /** Current working directory. */
    cwd(): t.StringDir;
  };

  /** Options for the `Path.trimCwd` method. */
  export type TrimCwdOptions = {
    /** Flag indicating if the "./" prefix should be retained (default: false). */
    prefix?: boolean;

    /** The CWD to use (default: current-working-directory). */
    cwd?: t.StringPath;
  };
}
