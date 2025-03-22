import { type t, isRecord, DEFAULT } from './common.ts';
import { AlphanumericWithHyphens, toString } from './u.ts';

export function createRules(args: { sheet: CSSStyleSheet }): t.CssDomRules {
  const { sheet } = args;
  const insertedRules = new Set<string>();

  const insertRule = (rule: string) => {
    if (insertedRules.has(rule)) return;
    sheet.insertRule?.(rule, sheet.cssRules.length);
    insertedRules.add(rule);
  };

  const api: t.CssDomRules = {
    get rules() {
      return Array.from(insertedRules);
    },

    add(selector, style) {
      insertRule(`${selector} { ${toString(style)} }`);
      Object.entries(style)
        .filter(([key]) => DEFAULT.pseudoClasses.has(key))
        .filter(([_, value]) => isRecord(value))
        .forEach(([key, value]) => insertRule(`${selector}${key} { ${toString(value)} }`));
    },
  };

  return api;
}
