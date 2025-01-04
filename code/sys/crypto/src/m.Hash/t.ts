import type { t } from '../common.ts';
export type * from './t.Is.ts';

type TrimPrefix = boolean;

/** Function that converts an input into a hash. */
export type ToHash = (input: any) => string;

/**
 * Tools for generating and manipulating Hash's.
 */
export type HashLib = {
  /** Boolean flag helpers for evaulating hash values.. */
  readonly Is: t.HashIsLib;

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
  shorten(
    hash: string,
    length: number | [number, number],
    options?: t.ShortenHashOptions | TrimPrefix,
  ): string;

  /** Resolve the various hash inputs into a single top-level hash value. */
  toString(input?: t.HashInput): string;

  /** Extract the prefix of the hash value, eg: "sha256-0x000" → "sha256" */
  prefix(input?: t.StringHash): string;
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
