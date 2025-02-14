import { type t, CssDom, CssTmpl, DEFAULT, toHash } from './common.ts';
import { isTransformed } from './u.is.ts';
import { toString } from './u.toString.ts';

type M = Map<number, t.CssTransformed>;
type O = Record<string, unknown>;

/**
 * Generator (factory).
 */
export const transformer: t.StyleLib['transformer'] = (options = {}) => {
  const { prefix = DEFAULT.prefix } = options;
  const dom = CssDom.create(prefix);
  const cache = new Map<number, t.CssTransformed>();
  const fn: t.CssTransform = (...input) => transform({ dom, cache, input });
  return fn;
};

/**
 * Perform a cacheable transformation on a loose set of CSS inputs.
 */
function transform(args: { dom: t.CssDom; cache: M; input: t.CssInput[] }): t.CssTransformed {
  const { dom, cache } = args;
  const style: t.CssProps = CssTmpl.transform(wrangle.input(args.input));
  const hx = toHash(style);
  if (cache.has(hx)) return cache.get(hx)!;

  const api: t.CssTransformed = {
    hx,
    get style() {
      return style;
    },
    get class() {
      return dom.class(style, hx);
    },
    toString: () => toString(style),
  };

  cache.set(hx, api);
  return api;
}

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
