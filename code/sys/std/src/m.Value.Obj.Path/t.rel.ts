import type { t } from './common.ts';

/**
 * Describes how two object-paths relate.
 *  - `equal`      if `a` and `b` are identical
 *  - `ancestor`   if `a` is a **strict** prefix of `b`
 *  - `descendant` if `a` is a **strict** extension of `b` (i.e. `b` is an ancestor of `a`)
 *  - `disjoint`   otherwise
 */
export type PathRelation = 'equal' | 'ancestor' | 'descendant' | 'disjoint';

/**
 * Utilities for determining relationships between object-paths.
 */
export type ObjPathRelLib = {
  /** Classify the relation between two paths. */
  relate(a?: t.ObjectPath, b?: t.ObjectPath): t.PathRelation;

  /** True if paths share a prefix (equal | ancestor | descendant). */
  overlaps(a?: t.ObjectPath, b?: t.ObjectPath): boolean;
};
