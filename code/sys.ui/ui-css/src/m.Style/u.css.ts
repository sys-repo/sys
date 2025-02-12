/**
 * @module
 */
import { type t, toHash } from './common.ts';
import { isTransformed } from './u.ts';

type O = Record<string, unknown>;
const cache = new Map<number, t.CssTransformed>();

export const css: t.CssTransformer = (...input) => {
  const before = wrangle.input(input);
  const hx = toHash(before);
  if (cache.has(hx)) return cache.get(hx)!;

  const style: t.CssObject = {};
  Object.entries(before).forEach(([key, value]) => ((style as any)[key] = value));

  const res: t.CssTransformed = { hx, style };
  cache.set(hx, res);
  return res;
};

/**
 * Helpers
 */
const wrangle = {
  input(input: any): t.CssObject {
    if (Array.isArray(input)) {
      return input.reduce((acc, next) => ({ ...acc, ...wrangle.input(next) }), {} as O);
    } else {
      if (typeof input !== 'object') return {};
      if (isTransformed(input)) return input.style;
      return input;
    }
  },
} as const;
