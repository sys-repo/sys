import { type t, CssDom, CssTmpl, Is, Obj, toString } from './common.ts';
import { isTransformed } from './u.is.ts';
import { createTransformContainer } from './u.transform.container.ts';

type M = Map<number, t.Style.Transform.Result>;
type O = Record<string, unknown>;
type F = t.Style.Lib['transformer'];

/**
 * Generator (factory).
 */
export const transformer: F = (options = {}) => {
  const cache = new Map<number, t.Style.Transform.Result>();

  let _sheet: t.CssDom.Stylesheet | undefined;
  const lazySheet = () => options.sheet ?? _sheet ?? CssDom.stylesheet(/* default config */);

  const fn: t.Style.Transform.Fn = (...input) => {
    const sheet = lazySheet();
    return transform({ sheet, cache, input });
  };
  return fn;
};

/**
 * Perform a cacheable transformation on a loose set of CSS inputs.
 */
function transform(args: {
  sheet: t.CssDom.Stylesheet;
  cache: M;
  input: t.Style.Input[];
}): t.Style.Transform.Result {
  const { sheet, cache } = args;

  const style: t.Style.Props = CssTmpl.transform(wrangle.input(args.input));
  const hx = Obj.hash(style);
  if (cache.has(hx)) return cache.get(hx)!;

  const api: t.Style.Transform.Result = {
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
      const { name, condition, style } = wrangle.containerArgs(args);
      const container = name ? sheet.container(name, condition) : sheet.container(condition);
      const block = container.scope(`.${api.class}`);
      return createTransformContainer(api, block, style);
    },
    rule(selector, style) {
      sheet.rules.add(`.${api.class} ${selector}`.trim(), style);
      return api;
    },
  };

  cache.set(hx, api);
  return api;
}

/**
 * Helpers:
 */
const wrangle = {
  input(input: any): t.Style.Props {
    if (Array.isArray(input)) {
      return input.reduce((acc, next) => ({ ...acc, ...wrangle.input(next) }), {} as O);
    } else {
      if (!Is.object(input)) return {};
      if (isTransformed(input)) return input.style;
      return input;
    }
  },

  containerArgs(args: any[]) {
    const done = (condition: string, name?: string, style?: t.Style.Props) => {
      name = name ? name.trim() : name;
      condition = condition ? condition.trim() : '';
      return { name, condition, style };
    };
    if (!args || args.length === 0) return done('');
    if (args.length === 1) return done(args[0]);
    if (args.length === 2) {
      const [p1, p2] = args;
      if (Is.object(p2)) return done(p1, undefined, p2);
      if (Is.str(p2)) return done(p2, p1);
    }
    if (args.length === 3) {
      const [p1, p2, p3] = args;
      return done(p2, p1, p3);
    }
    throw new Error(`Failed to parse [container.scope] arguments: ${args}`);
  },
} as const;
