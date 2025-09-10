import type { t } from './common.ts';

/**
 * Collection of supported object-path codecs.
 *
 *  - `pointer`   — RFC 6901 JSON Pointer, lossless & standard-compliant.
 *  - `dot`       — dot/bracket notation, ergonomic for developer use.
 *  - `default`   — the canonical codec (`pointer`).
 */
export type ObjPathCodecLib = {
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
   * Dot/bracket — ergonomic, still round-trips typical keys.
   * - Escapes dots and brackets in string keys with backslash.
   * - Numbers inside brackets become number indices.
   * - Empty path → ''.
   */
  readonly dot: t.ObjectPathCodec;
};

/** Kind of delimiter. */
export type ObjectPathCodecKind = 'pointer' | 'dot';

/**
 * An [ObjectPath] array → string encoder/decoder.
 * Keep codecs *pure*; any ergonomics (numeric coercion) are layered at the namespace.
 */
export type ObjectPathCodec = {
  readonly kind: ObjectPathCodecKind | (string & {});
  encode(path: t.ObjectPath): string;
  decode(text: string): t.ObjectPath; // pointer.decode returns string[] by design
};

/**
 * Options for namespace-level path encoding.
 * - `codec`: Which codec to use for encoding (defaults to `pointer`).
 */
export type PathEncodeOptions = {
  codec?: ObjectPathCodecKind | ObjectPathCodec;
};

/**
 * Options for namespace-level decode.
 * - `numeric: true` coerces digit-only tokens to numbers (e.g. "0" → 0).
 *   Pointer remains RFC-strict; coercion is applied *after* decode at the namespace.
 */
export type PathDecodeOptions = {
  codec?: ObjectPathCodecKind | ObjectPathCodec;
  numeric?: boolean;
};
