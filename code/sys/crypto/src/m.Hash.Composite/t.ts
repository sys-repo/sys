import type * as TSys from '@sys/types';
import type { t } from '../common.ts';

/** Represents a composite hash built from a sorted set of constituent hashes. */
export type CompositeHash = TSys.CompositeHash;

/**
 * Composite hash contracts.
 */
export declare namespace CompositeHash {
  /** Tools for building composite hashes. */
  export type Lib = {
    /** URI helpers for composite-hash parts. */
    readonly Uri: { readonly File: FileHashUri.Lib };

    /** Create a new composite-hash builder. */
    builder(options?: Builder.OptionsInput): Builder;

    /** Calculate the composite hash, aka digest, of the given set of hashes after sorting. */
    digest(parts: t.CompositeHash['parts'], options?: Digest.OptionsInput): t.StringHash;

    /** Abstractly verify a hash against content. */
    verify(hash: t.CompositeHash, args: Verify.ArgsInput): Promise<Verify.Response>;

    /** Wrangle an input to a simple concrete composite-hash object. */
    toComposite(input?: t.CompositeHash | Builder): t.CompositeHash;

    /** Sum the total byte-size of the given parts. */
    size(
      parts: t.CompositeHashParts,
      filter?: (e: { path: string; uri: FileHashUri.Parts }) => boolean,
    ): t.NumberBytes | undefined;
  };

  /** Loose input type for a hashing algorithm choice. */
  export type AlgoInput = 'sha256' | 'sha1' | t.Hash.ToHash;

  /** Structure used to build a composite hash. */
  export type Builder = t.CompositeHash & {
    /** The number of parts that make up the composite hash. */
    readonly length: number;

    /** The algorithm the builder is using to calculate hashes. */
    readonly algo: AlgoInput;

    /** Add a new hash to the set. */
    add(key: string, value: unknown): Builder;

    /** Remove the named hash from the set. */
    remove(key: string): Builder;

    /** Produce a simple composite-hash object. */
    toObject(): t.CompositeHash;

    /** Convert the builder into the digest string. */
    toString(): string;
  };

  /**
   * Composite-hash builder contracts.
   */
  export namespace Builder {
    /** Options passed to the composite-hash builder method. */
    export type Options = {
      /** Method for producing hashes. */
      algo?: AlgoInput;

      /** Initial items to add. */
      initial?: { key: string; value: unknown }[];
    };

    /** Loose input type for options passed to composite-hash builder creation. */
    export type OptionsInput = Options | Options['algo'] | Options['initial'];
  }

  /**
   * Composite-hash digest contracts.
   */
  export namespace Digest {
    /** Loose input type for options passed to the composite-hash digest method. */
    export type OptionsInput = Builder.Options;
  }

  /**
   * Composite-hash verification contracts.
   */
  export namespace Verify {
    /** Loose input type for args passed to the composite-hash verify method. */
    export type ArgsInput = Options | Loader;

    /** Options passed to the composite-hash verify method. */
    export type Options = {
      /** Method for producing hashes. */
      algo?: AlgoInput;

      /** Loader to retrieve the data to hash and compare. */
      loader: Loader;
    };

    /** Function that loads content to be verified against a hash. */
    export type Loader = (e: LoaderArgs) => Promise<Uint8Array | undefined | void>;

    /** Arguments passed to the hash verification loader. */
    export type LoaderArgs = { part: string };

    /** Response returned from the composite-hash verify method. */
    export type Response = {
      is: { valid?: boolean };

      /** The composite hash value. */
      hash: { a: t.CompositeHash; b: t.CompositeHash };

      /** Error details if any occurred. */
      error?: t.StdError;
    };
  }
}

/**
 * File hash URI contracts.
 */
export declare namespace FileHashUri {
  /** Helpers for reading and encoding file-hash URI strings. */
  export type Lib = {
    toUri(hash: string, bytes?: number): t.StringFileHashUri;
    fromUri(input: string): Parts;
  };

  /** A decomposed file-hash URI. */
  export type Parts = {
    hash: t.StringHash;
    bytes?: number;
  };
}
