import type { t } from './common.ts';

/**
 * Collection of supported object-path codecs.
 *
 *  - `pointer`   — RFC 6901 JSON Pointer, lossless & standard-compliant.
 *  - `dot`       — dot/bracket notation, ergonomic for developer use.
 *  - `default`   — the canonical codec (`pointer`).
 */
export type ObjectPathCodecLib = Readonly<{
  readonly default: t.ObjectPathCodec;
  /**
   * JSON Pointer (RFC 6901) — lossless & unambiguous.
   * - '' represents the root.
   * - '/' separates tokens.
   * - '~1' encodes '/', '~0' encodes '~'.
   * - Numbers are just strings here; still decode to number indices when they look numeric.
   */
  readonly pointer: t.ObjectPathCodec;
  /**
   * Dot/bracket — ergonomic, still round‑trips typical keys.
   * - Escapes dots and brackets in string keys with backslash.
   * - Numbers inside brackets become number indices.
   * - Empty path → ''.
   */
  readonly dot: t.ObjectPathCodec;
}>;

/** Kind of delimiter. */
export type ObjectPathCodecType = 'pointer' | 'dot';

/**
 * An [ObjectPath] array → string encoder/decoder.
 */
export type ObjectPathCodec = Readonly<{
  name: ObjectPathCodecType | (string & {});
  encode(path: t.ObjectPath): string;
  decode(text: string): t.ObjectPath;
}>;

export type PathEncodeOptions = { codec?: ObjectPathCodecType | ObjectPathCodec };
export type PathDecodeOptions = { codec?: ObjectPathCodecType | ObjectPathCodec };
