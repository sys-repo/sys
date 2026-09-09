import type { t } from '../common.ts';

/**
 * Hash helper contracts.
 */
export declare namespace Hash {
  /** Tools for generating and manipulating hashes. */
  export type Lib = {
    /** Boolean flag helpers for evaluating hash values. */
    readonly Is: Is.Lib;

    /** Generate a self-describing SHA1 hash of the given input. */
    sha1(input: unknown, options?: Options): string;

    /** Generate a self-describing SHA256 hash of the given input. */
    sha256(input: unknown, options?: Options): string;

    /** Convert an input for hashing to a `Uint8Array`. */
    toBytes(input: unknown, options?: Options): Uint8Array;

    /** Convert a bytes array to a hex string. */
    toHex(bytes: Uint8Array): string;

    /** Shorten a hash for display, format: `left .. right`. */
    shorten(
      hash: string,
      length: number | [number, number],
      options?: Shorten.OptionsInput,
    ): string;

    /** Resolve the various hash inputs into a single top-level hash value. */
    toString(input?: t.HashInput): string;

    /** Extract the prefix of the hash value, eg: `sha256-0x000` → `sha256`. */
    prefix(input?: t.StringHash): string;
  };

  /** Function that converts an input into a hash. */
  export type ToHash = (input: any) => string;

  /** Options passed to hash methods. */
  export type Options = {
    asString?: (input?: unknown) => string;
    prefix?: boolean;
  };

  /**
   * Hash shortening contracts.
   */
  export namespace Shorten {
    /** Options passed to the `Hash.shorten` method. */
    export type Options = {
      trimPrefix?: boolean | string | string[];
      divider?: string;
    };

    /** Flexible options accepted by `Hash.shorten`. */
    export type OptionsInput = Options | boolean;
  }

  /**
   * Hash predicate contracts.
   */
  export namespace Is {
    /** Boolean flag helpers for evaluating hash values. */
    export type Lib = {
      /** Determine if the given object represents a composite hash. */
      composite(input: unknown): input is t.CompositeHash;

      /** Determine if the given object is a composite-hash builder. */
      compositeBuilder(input: unknown): input is t.CompositeHash.Builder;

      /** Determine if the hash input is empty. */
      empty(input: t.HashInput): boolean;
    };
  }
}
