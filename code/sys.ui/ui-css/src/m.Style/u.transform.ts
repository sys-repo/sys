import { type t, toHash } from './common.ts';
import { isTransformed } from './u.is.ts';

type O = Record<string, unknown>;
const cache = new Map<number, t.CssTransformed>();

/**
 * Transform a lose set of CSS inputs into a CSS class-name.
 */
export const css: t.CssTransformToStyle = (...input) => transform(...input).style;

/**
 * Perform a cacheable transformation on a loose set of CSS inputs.
 */
export const transform: t.CssTransform = (...input) => {
  const before = wrangle.input(input);
  const hx = toHash(before);
  if (cache.has(hx)) return cache.get(hx)!;

  const style: t.CssProps = {};
  Object.entries(before).forEach(([key, value]) => ((style as any)[key] = value));

  const res: t.CssTransformed = { hx, style };
  cache.set(hx, res);
  return res;
};

/**
 * Helpers
 */
const wrangle = {
  input(input: any): t.CssProps {
    if (Array.isArray(input)) {
      return input.reduce((acc, next) => ({ ...acc, ...wrangle.input(next) }), {} as O);
    } else {
      if (typeof input !== 'object') return {};
      if (isTransformed(input)) return input.style;
      return input;
    }
  },
} as const;
