import type { t } from './common.ts';
import type { HashLib } from '@sys/std/t';

/**
 * (server extension of): HashLib
 * Tools for generating and manipulating Hash's.
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
  compute(dir: t.StringPath): Promise<HashDir>;
};

/**
 * Represents a hash of a directory.
 */
export type HashDir = {
  /* Flag indicating if the directory exists. */
  exists: boolean;

  /* Path to the directory the hashes pertains to */
  dir: t.StringDirPath;

  /* The overall hash of all file hashes (after they are sorted). */
  hash: t.StringHash;

  /* Map of hashes mapped to the file paths within the directory. */
  files: { [path: t.StringPath]: t.StringHash };

  /* Error details if one occured. */
  error?: t.StdError;
};
