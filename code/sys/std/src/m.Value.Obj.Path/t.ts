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
export type ObjPathLib = {
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

  /**
   * Utility: Coerce digit-only string tokens into numbers.
   * - Leaves non-digit strings intact (e.g. "01" stays "01").
   */
  asNumeric(path: readonly (string | number)[]): readonly (string | number)[];

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
   * Returns a shallow slice of the given object path.
   * Mirrors `Array.slice(start, end?)`, preserving `t.ObjectPath` typing.
   *
   * Example:
   *   Obj.Path.slice(['foo', 'bar', 'baz'], 0, 2)
   *   → ['foo', 'bar']
   */
  slice(path: t.ObjectPath, start: number, end?: number): t.ObjectPath;
};

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
