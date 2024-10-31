import type { t } from '../common.ts';

type OptionsInput = t.CompositeHashBuildOptions | t.CompositeHashBuildOptions['hash'];
export type CompositeHashAlgoInput = 'sha256' | 'sha1' | t.ToHash;

/**
 * Tools for building composite hashes.
 */
export type CompositeHashLib = {
  /** Generates an empty [CompositeHash] type. */
  empty(): t.CompositeHash;

  /** Create a new CompositeHash builder. */
  builder(options?: OptionsInput): t.CompositeHashBuilder;

  /** Calculate the composite hash (aka: "digest") of the given set of hashes after sorting. */
  digest(parts: t.CompositeHash['parts'], options?: OptionsInput): t.StringHash;

  /** Abstractly verify a hash against content.  */
  verify(
    hash: t.CompositeHash,
    args: t.CompositeHashVerifyOptions | t.HashVerifyLoader,
  ): Promise<t.HashVerifyResponse>;

  /** Wrangles an input to a concrete [CompositeHash] object/ */
  toComposite(input?: t.CompositeHash | t.CompositeHashBuilder): t.CompositeHash;
};

/** Options passed to the [CompositeHash].verify method. */
export type CompositeHashVerifyOptions = {
  /** Method for producing hashes. */
  hash?: CompositeHashAlgoInput;

  /** Loader to retrieve the data to hash and compare. */
  loader: HashVerifyLoader;
};

/** Function that loads content to be verified against a hash.  */
export type HashVerifyLoader = (e: HashVerifyLoaderArgs) => Promise<Uint8Array | undefined | void>;
export type HashVerifyLoaderArgs = { part: string };

/** Response returned from [CompositeHash].verify method. */
export type HashVerifyResponse = {
  is: { valid?: boolean };

  /** The composite hash value. */
  hash: { a: t.CompositeHash; b: t.CompositeHash };

  /** Error details if any occured. */
  error?: t.StdError;
};

/** Options passed to the [CompositeHash].build method. */
export type CompositeHashBuildOptions = {
  /** Method for producing hashes. */
  hash?: CompositeHashAlgoInput;
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
