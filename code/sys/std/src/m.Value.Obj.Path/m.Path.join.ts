import type { t } from './common.ts';

/**
 * Join a base path with a relative path under a chosen mode.
 * - 'absolute'  → prefix `rel` with `base` (when rel is non-empty).
 * - 'relative'  → return `rel` unchanged (or [] if absent).
 */
export const join: t.ObjPathLib['join'] = (base, rel, mode = 'absolute') => {
  const hasRel = !!rel && rel.length > 0;
  if (!hasRel) return mode === 'absolute' ? base : ([] as t.ObjectPath);
  if (mode === 'relative') return rel!;
  return base.length ? ([...base, ...rel!] as t.ObjectPath) : (rel! as t.ObjectPath);
};
