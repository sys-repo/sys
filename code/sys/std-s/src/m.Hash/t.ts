import type { t } from './common.ts';
import type { HashLib } from '@sys/std/t';

/**
 * `HashLib` (server extensions).
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
  compute(dir: t.StringDir, options?: t.HashDirComputeOptions | t.HashDirFilter): Promise<HashDir>;

  /**
   * Verify a direcotry against the given [CompositeHash] value.
   */
  verify(dir: t.StringDir, hash: t.StringHash | t.CompositeHash): Promise<HashDirVerifyResponse>;
};

/** Options passed to the `Hash.Dir.compute` method. */
export type HashDirComputeOptions = { filter?: HashDirFilter };

/** Filter out files included within a directory being hashed. */
export type HashDirFilter = (path: string) => boolean;

/**
 * Represents a hash of a directory.
 */
export type HashDir = {
  /** The composite hash value. */
  hash: t.CompositeHash;

  /** Path to the base directory the relative filepath hashes pertain to. */
  dir: t.StringDir;

  /** Flag indicating if the directory exists. */
  exists: boolean;

  /** Error details if any occured. */
  error?: t.StdError;
};

/**
 * The results of a verification of a directory.
 */
export type HashDirVerifyResponse = HashDir & {
  is: t.HashVerifyResponse['is'];
};
