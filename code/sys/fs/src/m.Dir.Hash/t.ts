import type { t } from './common.ts';

/**
 * Tools for working hashes of a file-system directory.
 */
export type DirHashLib = {
  /** Hash related console logging helpers. */
  readonly Fmt: t.FmtHashLib;

  /** Calculate the hash of a directory. */
  compute(dir: t.StringDir, options?: t.DirHashComputeOptions | t.DirHashFilter): Promise<DirHash>;

  /** Verify a directory against the given [CompositeHash] value. */
  verify(dir: t.StringDir, hash: t.StringHash | t.CompositeHash): Promise<DirHashVerifyResponse>;
};

/** Options passed to the `Hash.Dir.compute` method. */
export type DirHashComputeOptions = { filter?: DirHashFilter };

/** Filter out files included within a directory being hashed. */
export type DirHashFilter = (path: t.StringPath) => boolean;

/**
 * Represents a hash of a directory.
 */
export type DirHash = {
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
export type DirHashVerifyResponse = DirHash & {
  is: t.HashVerifyResponse['is'];
};
