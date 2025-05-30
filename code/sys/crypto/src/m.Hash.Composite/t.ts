import type { t } from '../common.ts';

/** Loose input type for a hashing algorithm choice. */
export type HashAlgoInput = 'sha256' | 'sha1' | t.ToHash;

/** Loose input type for options passed to Composite-Hash builder creation method. */
export type CompositeHashBuilderOptionsInput =
  | t.CompositeHashBuildOptions
  | t.CompositeHashBuildOptions['algo']
  | t.CompositeHashBuildOptions['initial'];

/** Loose input type for options passed to Composite-Hash digest method. */
export type CompositeHashDigestOptionsInput = t.CompositeHashBuildOptions;

/** Loose input type for args passed to the Composite-Hash verify method. */
export type CompositeHashVerifyArgsInput = t.CompositeHashVerifyOptions | t.HashVerifyLoader;

/**
 * Tools for building composite hashes.
 */
export type CompositeHashLib = {
  readonly Uri: { readonly File: FileHashUriLib };

  /** Create a new Composite-Hash builder. */
  builder(options?: t.CompositeHashBuilderOptionsInput): t.CompositeHashBuilder;

  /** Calculate the composite hash (aka: "digest") of the given set of hashes after sorting. */
  digest(
    parts: t.CompositeHash['parts'],
    options?: t.CompositeHashDigestOptionsInput,
  ): t.StringHash;

  /** Abstractly verify a hash against content.  */
  verify(
    hash: t.CompositeHash,
    args: t.CompositeHashVerifyArgsInput,
  ): Promise<t.HashVerifyResponse>;

  /**
   * Wrangles an input to a simple concrete Composite-Hash object.
   * Pass nothing to retrieve an empty version of the structure.
   */
  toComposite(input?: t.CompositeHash | t.CompositeHashBuilder): t.CompositeHash;

  /**
   * Sums the total byte-size of the given parts.
   * @returns The sum of all bytes extracted from the URIs, or `undefined`
   *          if `parts` is empty or none include byte-size data.
   */
  size(
    parts: t.CompositeHashParts,
    filter?: (e: { path: string; uri: t.FileHashUriParts }) => boolean,
  ): t.NumberBytes | undefined;
};

/** Options passed to the Composite-Hash.verify method. */
export type CompositeHashVerifyOptions = {
  /** Method for producing hashes. */
  algo?: t.HashAlgoInput;

  /** Loader to retrieve the data to hash and compare. */
  loader: t.HashVerifyLoader;
};

/** Function that loads content to be verified against a hash.  */
export type HashVerifyLoader = (e: HashVerifyLoaderArgs) => Promise<Uint8Array | undefined | void>;

/** Arguments passed to the `HashVerifyLoader`. */
export type HashVerifyLoaderArgs = { part: string };

/** Response returned from Composite-Hash.verify method. */
export type HashVerifyResponse = {
  is: { valid?: boolean };

  /** The composite hash value. */
  hash: { a: t.CompositeHash; b: t.CompositeHash };

  /** Error details if any occured. */
  error?: t.StdError;
};

/** Options passed to the Composite-Hash.build method. */
export type CompositeHashBuildOptions = {
  /** Method for producing hashes. */
  algo?: HashAlgoInput;

  /** Initial items to add. */
  initial?: { key: string; value: unknown }[];
};

/**
 * Structure used to build a CompositeHash.
 */
export type CompositeHashBuilder = t.CompositeHash & {
  /** The number of parts that make up the composite hash. */
  readonly length: number;

  /** The algorithm the builder is using to calculate hashes. */
  readonly algo: t.HashAlgoInput;

  /** Add a new hash to the set. */
  add(key: string, value: unknown): t.CompositeHashBuilder;

  /** Remove the name hash from the set. */
  remove(key: string): t.CompositeHashBuilder;

  /** Produce a simple {CompositeHash} object. */
  toObject(): t.CompositeHash;

  /** Convert the builder into the digest string. */
  toString(): string;
};

/**
 * URIs:
 */
export type FileHashUriLib = {
  toUri(hash: string, bytes?: number): t.StringFileHashUri;
  fromUri(input: string): FileHashUriParts;
};

/** A decomposed file-hash URI. */
export type FileHashUriParts = {
  hash: t.StringHash;
  bytes?: number;
};
