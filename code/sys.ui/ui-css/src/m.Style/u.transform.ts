import { type t, CssDom, CssTmpl, DEFAULT, toHash } from './common.ts';
import { isTransformed } from './u.is.ts';
import { toString } from './u.toString.ts';

type M = Map<number, t.CssTransformed>;
type O = Record<string, unknown>;
type F = t.StyleLib['transformer'];

/**
 * Generator (factory).
 */
export const transformer: F = (input) => {
  const options = wrangle.options(input);
  const { prefix = DEFAULT.prefix } = options;
  const dom = CssDom.createStylesheet(prefix);
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
    toString(kind = 'CssRule') {
      const rule = toString(style);
      if (kind === 'CssRule') return rule;
      if (kind === 'CssSelector') return `.${api.class} { ${rule} }`;
      throw new Error(`Kind '${kind}' not supported`);
    },
  };

  cache.set(hx, api);
  return api;
}

/**
 * Helpers
 */
const wrangle = {
  options(input?: Parameters<F>[0]): t.StyleTransformerOptions {
    if (!input) return {};
    if (typeof input === 'string') return { prefix: input };
    return input;
  },

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
