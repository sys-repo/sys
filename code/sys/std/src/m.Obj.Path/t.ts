import type { t } from './common.ts';

export type * from './t.codec.ts';
export type * from './t.curried.ts';
export type * from './t.diff.ts';
export type * from './t.is.ts';
export type * from './t.rel.ts';

type O = Record<string, unknown>;

/**
 * Tools for working with objects via abstract path arrays.
 */
export interface ObjPathLib {
  /** Predicates over object-paths. */
  readonly Is: t.ObjPathIsLib;

  /** Utilities for determining relationships between object-paths. */
  readonly Rel: t.ObjPathRelLib;

  /** Collection of codecs (pointer, dot, etc). */
  readonly Codec: t.ObjPathCodecLib;

  /**
   * Encode a path array → string.
   * - Uses the given codec (defaults to `pointer`).
   */
  encode(path: t.ObjectPath, opts?: t.PathEncodeOptions): string;

  /**
   * Decode a string → path array.
   * - Uses the given codec (defaults to `pointer`).
   * - `numeric: true` coerces digit-only tokens into numbers.
   */
  decode(text: string, opts?: t.PathDecodeOptions): t.ObjectPath;

  /** Apply conservative repairs to a path string before decoding. */
  sanitize(
    text: string,
    opts?: t.ObjPathSanitizeOptions,
  ): { readonly text: string; readonly fixes: t.ObjPathFix[] };

  /**
   * Utility: Coerce digit-only string tokens into numbers.
   * - Leaves non-digit strings intact (e.g. "01" stays "01").
   */
  asNumeric(path: readonly (string | number)[]): t.ObjectPath;

  /** Tools for mutating an object in-place. */
  Mutate: ObjPathMutateLib;

  /** Create a new curried-path instance for the given path. */
  curry: t.CurriedPathLib['make'];

  /**
   * Deep-get helper with overloads so the return type
   * is `T | undefined` unless you pass a default value.
   */
  get<T = unknown>(subject: O | undefined, path: t.ObjectPath): T | undefined;
  get<T = unknown>(subject: O | undefined, path: t.ObjectPath, defaultValue: t.NonUndefined<T>): T;

  /**
   * Determine if the given path exists on the subject, irrespective of value.
   */
  exists(subject: O | undefined, path: t.ObjectPath): boolean;

  /**
   * Compare two object paths for structural equality.
   * Returns true if both paths have the same parts in the same order.
   */
  eql(a?: t.ObjectPath, b?: t.ObjectPath): boolean;

  /**
   * Join a base path with a relative path under a chosen mode.
   * - 'absolute'  → prefix `rel` with `base` (when rel is non-empty).
   * - 'relative'  → return `rel` unchanged (or [] if absent).
   *
   * Notes:
   * - If `rel` is empty/undefined: returns `base` (absolute) or [] (relative).
   * - If `base` is empty and mode is 'absolute', returns `rel`.
   */
  join(base: t.ObjectPath, rel?: t.ObjectPath, mode?: t.PathMode): t.ObjectPath;

  /**
   * Concatenate multiple object-path segments into a single path.
   *
   * - Default mode: `'absolute'`
   * - Optional first parameter may be `'absolute' | 'relative'` to override.
   * - Skips empty or undefined segments.
   * - Equivalent to:
   *     ```ts
   *     segments.reduce((acc, seg) => join(acc, seg, mode), [])
   *     ```
   *
   * Examples:
   *   Obj.Path.joinAll(['foo'], ['bar']);                    // → ['foo','bar']
   *   Obj.Path.joinAll('relative', ['foo'], ['bar']);        // → ['bar']
   *   Obj.Path.joinAll('absolute', ['a'], ['b','c'], ['d']); // → ['a','b','c','d']
   */
  joinAll(...segments: t.ObjectPath[]): t.ObjectPath;
  joinAll(mode: t.PathMode, ...segments: t.ObjectPath[]): t.ObjectPath;

  /**
   * Returns a shallow slice of the given object path.
   * Mirrors `Array.prototype.slice(start, end?)` (pure, half-open, immutable).
   *
   * Examples:
   *   Obj.Path.slice(['a','b','c','d'], 1, 3)  → ['b','c']
   *   Obj.Path.slice(['a','b','c','d'], -2)    → ['c','d']
   *   Obj.Path.slice(['a','b','c','d'], 0, -1) → ['a','b','c']
   */
  slice(path: t.ObjectPath, start: number): t.ObjectPath;
  slice(path: t.ObjectPath, start: number, end: number): t.ObjectPath;

  /**
   * Normalize a "path-like" value into the canonical ObjectPath.
   * - Arrays (`(string|number)[]`) pass through.
   * - Strings decode via the chosen codec (default: "pointer").
   * - `numeric: true` coerces digit-only tokens to numbers (e.g. "0" → 0).
   * - Anything else returns `[]`.
   */
  normalize(
    input: unknown,
    opts?: {
      codec?: t.ObjectPathCodecKind | t.ObjectPathCodec;
      numeric?: boolean;
    },
  ): t.ObjectPath;

  /**
   * Returns a new path where the last token has the given suffix appended.
   * - The suffix is treated as an opaque string (no special handling for "." or anything else).
   * - The input path is not mutated.
   *
   * Example:
   *   Obj.Path.appendSuffix(['foo', 'bar'], '.parsed') → ['foo', 'bar.parsed']
   *   Obj.Path.appendSuffix(['id'], '-v1')             → ['id-v1']
   */
  appendSuffix(path: t.ObjectPath, suffix: string): t.ObjectPath;
  appendSuffix(path: undefined, suffix: string): undefined;
  appendSuffix(path: t.ObjectPath | undefined, suffix: string): t.ObjectPath | undefined;
}

/**
 * Tools that mutate an object in-place using
 * an abstract path arrays.
 */
export type ObjPathMutateLib = {
  /**
   * Deep-set helper that mutates `subject` setting a nested value at the `path`.
   *  - Creates intermediate objects/arrays as needed.
   *  - If `value` is `undefined`, the property is removed via [delete] rather than assigned `undefined`.
   */
  set<T = unknown>(subject: O, path: t.ObjectPath, value: T): t.ObjDiffOp | undefined;

  /**
   * Ensure a value at the given path exists (not undefined),
   * and if not assigns the given default.
   */
  ensure<T = unknown>(subject: O, path: t.ObjectPath, defaultValue: t.NonUndefined<T>): T;

  /**
   * Deletes the value at the given path if it exists.
   */
  delete(subject: O, path: t.ObjectPath): t.ObjDiffOp | undefined;

  /**
   * Mutate `target` in-place so that, once the function returns,
   * `target` is a deep structural clone of `source`.
   *
   *  - Uses {@link Obj.Path.Mutate.set} for every write/delete.
   *  - Walks objects deeply; whole arrays are replaced when they differ (unless `diffArrays` is true).
   *  - No external dependencies, deterministic, and ~75 LOC.
   */
  diff<T extends O = O>(source: T, target: T, options?: t.ObjDiffOptions): t.ObjDiffReport;
};

/**
 * Options and Result Structures:
 */

/** Options controlling how a path string is sanitized before decoding. */
export type ObjPathSanitizeOptions = { codec?: t.ObjectPathCodecKind | t.ObjectPathCodec };

/** String-level repair kinds applied by {@link Path.sanitize}. */
export type ObjPathFix =
  /** Removed leading/trailing whitespace. */
  | 'trimmed'
  /** Added a leading slash for non-empty pointer paths. */
  | 'ensured-leading-slash'
  /** Collapsed consecutive slashes into a single '/'. */
  | 'collapsed-multiple-slashes'
  /** Removed a trailing slash (except when the path is just '/'). */
  | 'removed-trailing-slash';

/** Options for tolerant decoding; extends PathDecodeOptions with a fallback path. */
export type PathTryDecodeOptions = t.PathDecodeOptions & {
  fallback?: t.ObjectPath;
};

/** Structured result returned from tryDecode, including success flag, path, and any applied fixes. */
export type PathTryDecodeResult =
  | { readonly ok: true; readonly path: t.ObjectPath; readonly fixes: readonly t.ObjPathFix[] }
  | {
      readonly ok: false;
      readonly path: t.ObjectPath;
      readonly fixes: readonly t.ObjPathFix[];
      readonly error: Error;
    };
