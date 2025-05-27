import { type t, DEFAULT, Obj } from './common.ts';
import { AlphanumericWithHyphens } from './u.ts';

export function createClasses(args: { rules: t.CssDomRules; prefix?: string }): t.CssDomClasses {
  const { rules } = args;
  const inserted = new Set<string>();
  const prefix = wrangleClassPrefix(args.prefix);

  const validation = AlphanumericWithHyphens.safeParse(prefix);
  if (!validation.success) {
    const err = validation.error.issues
      .map((m) => m.message)
      .join('. ')
      .trim();
    throw new Error(err);
  }

  const api: t.CssDomClasses = {
    prefix,
    get names() {
      return Array.from(inserted);
    },
    add(style, options = {}) {
      const hx = options.hx ?? Obj.hash(style);
      const className = `${prefix}-${hx}`;
      if (inserted.has(className)) {
        return className;
      } else {
        rules.add(`.${className}`, style);
        inserted.add(className);
        return className;
      }
    },
  };

  return api;
}

/**
 * Helpers:
 */
export function wrangleClassPrefix(input: string | undefined, defaultPrefix?: string) {
  const res = (input ?? '').trim() || (defaultPrefix ?? DEFAULT.classPrefix);
  return res.replace(/^\.*/, '').replace(/-*$/, '');
}
