import type { t } from './common.ts';

/** Loose parameter input for a value that is a hash. */
export type HashInput = t.StringHash | t.CompositeHash;

/**
 * Represents a compsite hash built out of a set of consitituent
 * hashes (eg. file hashes) calculated in a standardised consistent manner
 * based on the sorted hash-keys.
 */
export type CompositeHash = {
  /** The rollup of all the sorted component hashes. */
  readonly digest: t.StringHash;

  /** The constituent parts that make up the hash. */
  readonly parts: t.CompositeHashParts;
};

/**
 * A map of the constituent parts that make up a Compsite-Hash digest.
 */
export type CompositeHashParts = {
  readonly [key: string]: FileHashUri;
};

/**
 * A URI format of: "<algo>-<hash>:bytes-<total>"
 */
export type FileHashUri = t.StringUri;
