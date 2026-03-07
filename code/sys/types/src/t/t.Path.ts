import type { t } from './common.ts';

/**
 * A "path-like" input that can be either:
 *  - a structured {@link ObjectPath} array, or
 *  - a string form (e.g. JSON Pointer or dot notation).
 *
 * Used in APIs that accept both raw arrays and encoded path strings.
 */
export type PathLike = t.ObjectPath | string;

/**
 * Represent an array of path parts,
 * eg: "foo.bar" → ['foo', 'bar']
 */
export type ObjectPath = (string | t.Index)[];

/**
 * How to combine a base path with a relative path.
 *
 * - "absolute": prefix `rel` with `base` when `rel` is non-empty;
 *               if `rel` is empty/undefined → return `base`.
 * - "relative": ignore `base`; return `rel`;
 *               if `rel` is empty/undefined → return [].
 */
export type PathMode = 'absolute' | 'relative';
