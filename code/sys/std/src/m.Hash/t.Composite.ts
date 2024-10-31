import type { t } from '../common.ts';

type OptionsInput = t.CompositeHashOptions | t.CompositeHashOptions['hash'];

/**
 * Tools for building composite hashes.
 */
export type CompositeHashLib = {
  /** Create a new CompositeHash builder. */
  create(options?: OptionsInput): t.CompositeHashBuilder;

  /** Calculate the composite hash (aka: "digest") of the given set of hashes after sorting. */
  digest(parts: t.CompositeHash['parts'], options?: OptionsInput): t.StringHash;

  /** Generates an empty [CompositeHash] type. */
  empty(): t.CompositeHash;
};

/** Options passed to the CompositeHash generator. */
export type CompositeHashOptions = {
  /** Method for producing hashes */
  hash?: 'sha256' | 'sha1' | t.ToHash;
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
  toObject(): t.CompositeHash;

  /** Convert the builder into the digest string. */
  toString(): string;
};
