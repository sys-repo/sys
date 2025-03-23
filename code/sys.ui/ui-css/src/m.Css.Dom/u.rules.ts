import { type t, DEFAULT, isRecord } from './common.ts';
import { toString } from './u.ts';

type StringRule = string;

export function createRules(args: { sheet: CSSStyleSheet }): t.CssDomRules {
  const { sheet } = args;
  const inserted = new Set<StringRule>();

  const insert = (rule: string, context?: string) => {
    const finalRule = context ? `${context} { ${rule} }` : rule;
    if (inserted.has(finalRule)) return;
    sheet.insertRule?.(finalRule, sheet.cssRules.length);
    inserted.add(finalRule);
  };

  const addRule = (selector: string, style: t.CssProps, context?: string) => {
    insert(`${selector} { ${toString(style)} }`, context);
    Object.entries(style)
      .filter(([key]) => DEFAULT.pseudoClasses.has(key))
      .filter(([, value]) => isRecord(value))
      .forEach(([key, value]) => insert(`${selector}${key} { ${toString(value)} }`, context));
  };

  const api: t.CssDomRules = {
    get list() {
      return Array.from(inserted);
    },

    add(selector, styles, options = {}) {
      const { context } = options;
      const list = Array.isArray(styles) ? styles : [styles];
      list.forEach((style) => addRule(selector, style, context));
    },
  };

  return api;
}
