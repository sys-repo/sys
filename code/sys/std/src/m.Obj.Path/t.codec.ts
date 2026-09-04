import type { t } from './common.ts';

/**
 * Collection of supported object-path codecs.
 *
 *  - `pointer`   — RFC 6901 JSON Pointer, lossless & standard-compliant.
 *  - `dot`       — dot/bracket notation, ergonomic for developer use.
 *  - `default`   — the canonical codec (`pointer`).
 */
export type Lib = {
  readonly default: Definition;

  /**
   * JSON Pointer (RFC 6901) — lossless & unambiguous.
   * - '' represents the root.
   * - '/' separates tokens.
   * - '~1' encodes '/', '~0' encodes '~'.
   * - Numbers are just strings here; still decode to number indices when they look numeric.
   */
  readonly pointer: Definition;

  /**
   * Dot/bracket — ergonomic, still round-trips typical keys.
   * - Escapes dots and brackets in string keys with backslash.
   * - Numbers inside brackets become number indices.
   * - Empty path → ''.
   */
  readonly dot: Definition;
};

/** Kind of delimiter. */
export type Kind = 'pointer' | 'dot';

/**
 * An [ObjectPath] array → string encoder/decoder.
 * Keep codecs *pure*; any ergonomics (numeric coercion) are layered at the namespace.
 */
export type Definition = {
  readonly kind: Kind | (string & {});
  encode(path: t.ObjectPath): string;
  decode(text: string): t.ObjectPath; // pointer.decode returns string[] by design
};

/**
 * Options for namespace-level path encoding.
 * - `codec`: Which codec to use for encoding (defaults to `pointer`).
 */
export type EncodeOptions = {
  codec?: Kind | Definition;
};

/** Options for namespace-level decode.
 * - `numeric: true` coerces digit-only tokens to numbers (e.g. "0" → 0).
 * - `safe: true` pre-sanitizes the string before strict decode (may still throw).
 */
export type DecodeOptions = {
  codec?: Kind | Definition;
  numeric?: boolean;
  safe?: boolean;
};
