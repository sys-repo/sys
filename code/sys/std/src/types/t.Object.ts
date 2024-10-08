import type { t } from './common.ts';

/**
 * Represent an array of path parts,
 * eg: "foo.bar" → ['foo', 'bar']
 *
 */
export type ObjectPath = (string | t.Index)[];
