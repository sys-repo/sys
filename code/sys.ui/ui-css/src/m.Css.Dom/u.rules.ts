import { type t, CssTmpl, isRecord } from './common.ts';
import { CssPseudoClass } from './m.CssPseudoClass.ts';
import { toString } from './u.ts';

type StringRule = string;

export function createRules(args: { sheet: CSSStyleSheet }): t.CssDom.Rules {
  const { sheet } = args;
  const inserted = new Map<StringRule, t.CssDom.InsertedRule>();

  const insert = (
    selector: string,
    style: t.Style.Props,
    context?: string,
  ): t.CssDom.InsertedRule | undefined => {
    let rule = `${selector.trim()} { ${toString(style)} }`.trim();
    rule = context ? `${context} { ${rule} }` : rule;
    if (inserted.has(rule)) return undefined;

    const res: t.CssDom.InsertedRule = { selector, rule, style };
    sheet.insertRule?.(rule, sheet.cssRules.length);
    inserted.set(rule, res);
    return res;
  };

  const addRule = (
    selector: string,
    style: t.Style.Value,
    context?: string,
  ): t.CssDom.InsertedRule[] => {
    const res: (t.CssDom.InsertedRule | undefined)[] = [];
    res.push(insert(selector, CssTmpl.transform(style), context));
    Object.entries(style)
      .filter(([key]) => CssPseudoClass.isClass(key))
      .filter(([, value]) => isRecord(value))
      .forEach(([key, style]) => res.push(insert(`${selector}${key}`, style, context)));
    return res.filter(Boolean) as t.CssDom.InsertedRule[];
  };

  const api: t.CssDom.Rules = {
    get length() {
      return inserted.size;
    },
    get items() {
      return Array.from(inserted.values());
    },

    add(selector, styles, options = {}) {
      const res: t.CssDom.InsertedRule[] = [];
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
