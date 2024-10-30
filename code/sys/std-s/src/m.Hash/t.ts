import type { t } from './common.ts';
import type { HashLib } from '@sys/std/t';

/**
 * `HashLib` (server extensions)
 *
 * Tools for generating and manipulating Hash's
 * within the context of a files and a file-system.
 */
export type HashSLib = HashLib & {
  readonly Dir: t.HashDirLib;
};

/**
 * Tools for working hashes of a file-system directory.
 */
export type HashDirLib = {
  /**
   * Calculate the hash of a directory.
   */
  compute(base: t.StringDir, options?: t.HashDirComputeOptions | t.HashDirFilter): Promise<HashDir>;
};

/* Options passed to the `Hash.Dir.compute` method. */
export type HashDirComputeOptions = { filter?: HashDirFilter };

/* Filter out files included within a directory being hashed. */
export type HashDirFilter = (path: string) => boolean;

/**
 * Represents a hash of a directory.
 */
export type HashDir = {
  /* Flag indicating if the directory exists. */
  exists: boolean;

  /* Path to the base directory the relative filepath hashes pertain to. */
  base: t.StringDir;

  /* The overall hash of all file hashes (after they are sorted). */
  hash: t.StringHash;

  /* Map of hashes mapped to the file paths within the directory. */
  files: { [path: t.StringPath]: t.StringHash };

  /* Error details if one occured. */
  error?: t.StdError;
};
