import type { t } from './common.ts';

/**
 * Library: helpers for working with resource paths with the existence of the server FS tools.
 */
export type FsPathLib = t.PathLib & {
  /**
   * Convert the path to it's parent directory if it is not already a directory target.
   */
  asDir(path: t.StringPath): Promise<t.StringPath>;

  /**
   * Removes the CWD (current-working-directory) from the given path if it exists.
   */
  trimCwd(path: t.StringPath, options?: t.FsPathTrimCwdOptions | boolean): t.StringPath;

  /** Current working directory. */
  cwd(): t.StringDir;
};

/**
 * Options for the `Path.trimCwd` method.
 */
export type FsPathTrimCwdOptions = {
  /** Flag indicating if the "./" prefix should be retained (default: false). */
  prefix?: boolean;

  /** The CWD to use (default: current-working-directory) */
  cwd?: t.StringPath;
};
