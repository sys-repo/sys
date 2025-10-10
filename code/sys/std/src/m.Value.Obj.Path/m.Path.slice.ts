import type { t } from './common.ts';

/**
 * Returns a shallow slice of the given object path.
 * Mirrors `Array.prototype.slice(start, end?)` (pure, half-open, negative indices supported).
 */
export const slice: t.ObjPathLib['slice'] = (path, start, end?) => {
  const { P, S, E } = wrangle.args([path, start, end]);
  return P.slice(S, E) as t.ObjectPath;
};

/**
 * Helpers:
 */
const wrangle = {
  args(input: readonly unknown[]) {
    const [path, start, end] = input;

    // trust types at call-sites; fallback defensively
    const P = (Array.isArray(path) ? path : []) as t.ObjectPath;
    const S = typeof start === 'number' ? start : 0;
    const E = typeof end === 'number' ? end : undefined;

    return { P, S, E };
  },
} as const;
