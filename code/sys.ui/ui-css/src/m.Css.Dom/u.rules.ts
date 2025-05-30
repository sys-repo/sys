import { type t, CssTmpl, DEFAULT, isRecord } from './common.ts';
import { toString } from './u.ts';
import { CssPseudoClass } from './m.CssPseudoClass.ts';

type StringRule = string;

export function createRules(args: { sheet: CSSStyleSheet }): t.CssDomRules {
  const { sheet } = args;
  const inserted = new Map<StringRule, t.CssDomInsertedRule>();

  const insert = (
    selector: string,
    style: t.CssProps,
    context?: string,
  ): t.CssDomInsertedRule | undefined => {
    let rule = `${selector.trim()} { ${toString(style)} }`.trim();
    rule = context ? `${context} { ${rule} }` : rule;
    if (inserted.has(rule)) return undefined;

    const res: t.CssDomInsertedRule = { selector, rule, style };
    sheet.insertRule?.(rule, sheet.cssRules.length);
    inserted.set(rule, res);
    return res;
  };

  const addRule = (
    selector: string,
    style: t.CssValue,
    context?: string,
  ): t.CssDomInsertedRule[] => {
    const res: (t.CssDomInsertedRule | undefined)[] = [];
    res.push(insert(selector, CssTmpl.transform(style), context));
    Object.entries(style)
      .filter(([key]) => CssPseudoClass.isClass(key))
      .filter(([, value]) => isRecord(value))
      .forEach(([key, style]) => res.push(insert(`${selector}${key}`, style, context)));
    return res.filter(Boolean) as t.CssDomInsertedRule[];
  };

  const api: t.CssDomRules = {
    get length() {
      return inserted.size;
    },
    get items() {
      return Array.from(inserted.values());
    },

    add(selector, styles, options = {}) {
      const res: t.CssDomInsertedRule[] = [];
      const { context } = options;
      const list = Array.isArray(styles) ? styles : [styles];
      list.forEach((style) => {
        res.push(...addRule(selector, style, context));
      });
      return res;
    },
  };

  return api;
}
