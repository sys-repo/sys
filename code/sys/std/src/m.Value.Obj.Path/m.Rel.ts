import { type t } from './common.ts';

/**
 * Utilities for determining relationships between object-paths.
 */
export const Rel: t.ObjPathRelLib = {
  relate(a, b) {
    const A = normalize(a);
    const B = normalize(b);

    const common = commonPrefixLen(A, B);

    if (common === A.length && common === B.length) return 'equal';
    if (common === A.length) return 'ancestor';
    if (common === B.length) return 'descendant';
    return 'disjoint';
  },

  overlaps(a, b) {
    return this.relate(a, b) !== 'disjoint';
  },
};

/**
 * Helpers:
 */

function normalize(p?: t.ObjectPath): t.ObjectPath {
  return Array.isArray(p) ? p : [];
}

function commonPrefixLen(a: t.ObjectPath, b: t.ObjectPath): number {
  const n = Math.min(a.length, b.length);
  let i = 0;
  for (; i < n; i += 1) {
    if (a[i] !== b[i]) break;
  }
  return i;
}
