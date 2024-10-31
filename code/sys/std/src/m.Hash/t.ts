import type { t } from '../common.ts';

/**
 * Tools for generating and manipulating Hash's.
 */
export type HashLib = {
  /**
   * Generate a self-describing SHA1 hash of the given input.
   *
   * NOTE:
   *    This is not cryptographically secure.
   *    It is however useful for generating hashes on files that for
   *    de-duping where cryptographic security is not required.
   *
   */
  sha1(input: unknown, options?: t.HashOptions): string;

  /** Generate a self-describing SHA256 hash of the given input. */
  sha256(input: unknown, options?: t.HashOptions): string;

  /** Convert an input for hashing to a [Uint8Array]. */
  toBytes(input: unknown, options?: t.HashOptions): Uint8Array;

  /** Convert a bytes array to a hex string. */
  toHex(bytes: Uint8Array): string;

  /** Shorten a hash for display, format: "left .. right". */
  shorten(hash: string, length: number | [number, number], options?: t.ShortenHashOptions): string;

  /** Tools for creating `CompositeHash` digests. */
  readonly Composite: t.CompositeHashLib;

  /** Create a new `CompositeHash` builder. */
  composite: t.CompositeHashLib['create'];
};

/** Options passed to Hash methods. */
export type HashOptions = {
  asString?: (input?: unknown) => string;
  prefix?: boolean;
};

/** Options passed to the Hash.shorten method. */
export type ShortenHashOptions = {
  trimPrefix?: boolean | string | string[];
  divider?: string;
};

/** Function that converts an input into a hash. */
export type ToHash = (input: any) => string;

/**
 * Tools for building composite hashes.
 */
export type CompositeHashLib = {
  /** Create a new CompositeHash builder. */
  create(options?: t.CompositeHashOptions): t.CompositeHashBuilder;

  /** Generate a composite hash of the given set of hashes after sorting. */
  digest(parts: t.CompositeHash['parts'], options?: t.CompositeHashOptions): t.StringHash;
};

/** Options passed to the CompositeHash generator. */
export type CompositeHashOptions = {
  /** Method for producing hashes */
  hash?: 'sha256' | 'sha1' | t.ToHash;
};

/**
 * Represents a compsite hash built out of a set of consitituent
 * hashes (eg. file hashes) calculated in a standardised consistent manner
 * based on the sorted hash-keys.
 */
export type CompositeHash = {
  /** The rollup of all the sorted component hashes. */
  readonly digest: t.StringHash;

  /** The constituent parts that make up the hash. */
  readonly parts: { readonly [key: string]: t.StringHash };
};

/**
 * Structure used to build a CompositeHash.
 */
export type CompositeHashBuilder = t.CompositeHash & {
  /** The number of parts that make up the composite hash. */
  readonly length: number;

  /** Add a new hash to the set. */
  add(key: string, value: unknown): t.CompositeHashBuilder;

  /** Remove the name hash from the set. */
  remove(key: string): t.CompositeHashBuilder;

  /** Produce a simple {CompositeHash} object. */
  toObject(): CompositeHash;

  /** Convert the builder into the digest string. */
  toString(): string;
};
