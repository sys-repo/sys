import type { t } from './common.ts';

/**
 * Predicates over object-paths (arrays of segments).
 */
export type ObjPathIsLib = {
  /** True if `a` is a prefix of `b` (including equal). */
  prefixOf(a: t.ObjectPath, b: t.ObjectPath): boolean;

  /** Optional niceties if you want them: */
  equal(a: t.ObjectPath, b: t.ObjectPath): boolean;

  /** True if `a` is a proper prefix of `b` (prefixOf(a,b) && !equal(a,b)). */
  ancestorOf(a: t.ObjectPath, b: t.ObjectPath): boolean;

  /** True if `a` is a proper descendant of `b` (prefixOf(b,a) && !equal(a,b)). */
  descendantOf(a: t.ObjectPath, b: t.ObjectPath): boolean;
};
