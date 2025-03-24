import { type t, CssDom, CssTmpl, toHash, toString } from './common.ts';
import { isTransformed } from './u.is.ts';
import { createTransformContainer } from './u.transform.container.ts';

type M = Map<number, t.CssTransformed>;
type O = Record<string, unknown>;
type F = t.StyleLib['transformer'];

/**
 * Generator (factory).
 */
export const transformer: F = (options = {}) => {
  const cache = new Map<number, t.CssTransformed>();

  let _sheet: t.CssDomStylesheet | undefined;
  const lazySheet = () => options.sheet ?? _sheet ?? CssDom.stylesheet(/* default config */);

  const fn: t.CssTransform = (...input) => {
    const sheet = lazySheet();
    return transform({ sheet, cache, input });
  };
  return fn;
};

/**
 * Perform a cacheable transformation on a loose set of CSS inputs.
 */
function transform(args: {
  sheet: t.CssDomStylesheet;
  cache: M;
  input: t.CssInput[];
}): t.CssTransformed {
  const { sheet, cache } = args;

  const style: t.CssProps = CssTmpl.transform(wrangle.input(args.input));
  const hx = toHash(style);
  if (cache.has(hx)) return cache.get(hx)!;

  const api: t.CssTransformed = {
    hx,
    get style() {
      return style;
    },
    get class() {
      const classes = sheet.classes();
      return classes.add(style, { hx });
    },
    toString(kind = 'CssRule') {
      const rule = toString(style);
      if (kind === 'CssRule') return rule;
      if (kind === 'CssSelector') return `.${api.class} { ${rule} }`;
      throw new Error(`Kind '${kind}' not supported`);
    },
    container(...args: any[]) {
      const className = api.class;
      const { name, condition, style } = wrangle.containerArgs(args);
      return createTransformContainer({ sheet, className, name, condition, style });
    },
  };

  cache.set(hx, api);
  return api;
}

/**
 * Helpers:
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

  containerArgs(args: any[]) {
    const done = (condition: string, name?: string, style?: t.CssProps) => {
      name = name ? name.trim() : name;
      condition = condition ? condition.trim() : '';
      return { name, condition, style };
    };
    if (!args || args.length === 0) return done('');
    if (args.length === 1) return done(args[0]);
    if (args.length === 2) {
      const [p1, p2] = args;
      if (typeof p2 === 'object') return done(p1, undefined, p2);
      if (typeof p2 === 'string') return done(p2, p1);
    }
    if (args.length === 3) {
      const [p1, p2, p3] = args;
      return done(p2, p1, p3);
    }
    throw new Error(`Failed to parse [container.scope] arguments: ${args}`);
  },
} as const;
