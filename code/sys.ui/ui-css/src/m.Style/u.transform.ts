import { type t, toHash } from './common.ts';
import { isTransformed } from './u.is.ts';
import { toString } from './u.toString.ts';
import { CssDom } from './m.CssDom.ts';

type O = Record<string, unknown>;
const cache = new Map<number, t.CssTransformed>();
let _dom: t.CssDom | undefined;

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

  const api: t.CssTransformed = {
    hx,
    style,
    get class() {
      const dom = _dom || (_dom = CssDom.create());
      return dom.insert(style, hx);
    },
    toString: () => toString(style),
  };

  cache.set(hx, api);
  return api;
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
