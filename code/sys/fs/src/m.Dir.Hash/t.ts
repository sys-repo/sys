import type { t } from './common.ts';

/**
 * Tools for working hashes of a file-system directory.
 */
export type HashDirLib = {
  /**
   * Calculate the hash of a directory.
   */
  compute(dir: t.StringDir, options?: t.HashDirComputeOptions | t.HashDirFilter): Promise<HashDir>;

  /**
   * Verify a directory against the given [CompositeHash] value.
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

/**
 * Console (Logging and Display).
 */
export type DirHashLogLib = {
  digest(input?: t.HashInput, options?: { length?: number }): string;
};
