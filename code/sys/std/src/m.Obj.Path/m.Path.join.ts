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

/**
 * Concatenate multiple object-path segments into a single path.
 *
 * - Default mode: 'absolute'
 * - Optional first arg may be 'absolute' | 'relative' to override.
 * - Skips empty/undefined segments.
 * - Equivalent to: segments.reduce((acc, seg) => join(acc, seg, mode), [])
 */
export const joinAll: t.ObjPathLib['joinAll'] = (...args: unknown[]) => {
  const isMode = (x: unknown): x is t.PathMode => x === 'absolute' || x === 'relative';

  const mode: t.PathMode =
    args.length > 0 && isMode(args[0]) ? (args[0] as t.PathMode) : 'absolute';

  const segments: readonly t.ObjectPath[] =
    args.length > 0 && isMode(args[0])
      ? (args.slice(1) as t.ObjectPath[])
      : (args as t.ObjectPath[]);

  let acc: t.ObjectPath = [];
  for (const seg of segments) {
    if (seg && seg.length > 0) acc = join(acc, seg, mode);
  }
  return acc;
};
