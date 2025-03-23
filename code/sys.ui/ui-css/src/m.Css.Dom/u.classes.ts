import { type t, DEFAULT, toHash, V } from './common.ts';
import { AlphanumericWithHyphens } from './u.ts';

export function createClasses(args: { rules: t.CssDomRules; prefix?: string }): t.CssDomClasses {
  const { rules } = args;
  const inserted = new Set<string>();
  const prefix = wrangleClassPrefix(args.prefix);
  V.parse(AlphanumericWithHyphens, prefix);

  const api: t.CssDomClasses = {
    prefix,
    get names() {
      return Array.from(inserted);
    },
    add(style, options = {}) {
      const hx = options.hx ?? toHash(style);
      const className = `${prefix}-${hx}`;
      if (inserted.has(className)) {
        return className;
      } else {
        inserted.add(className);
        rules.add(`.${className}`, style);
        return className;
      }
    },
  };

  return api;
}

/**
 * Helpers
 */
export function wrangleClassPrefix(input: string | undefined) {
  const res = (input ?? '').trim() || DEFAULT.classPrefix;
  return res.replace(/^\.*/, '').replace(/-*$/, '');
}
