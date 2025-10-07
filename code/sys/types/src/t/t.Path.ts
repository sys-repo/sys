import type { t } from './common.ts';

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
