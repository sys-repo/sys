import { type t } from './common.ts';

export function createContext(args: {
  rules: t.CssDomRules;
  kind: t.CssDomContainerBlock['kind'];
  condition: string;
}): t.CssDomContainerBlock {
  const { rules, kind } = args;
  const condition = wrangle.condition(args.condition);

  const api: t.CssDomContainerBlock = {
    kind,
    condition,
    rule(selector, style) {
      const context = api.toString();
      return rules.add(selector, style, { context });
    },
    toString() {
      return `${kind} ${condition}`;
    },
  };

  return api;
}

/**
 * Helpers
 */
const wrangle = {
  condition(text: string): string {
    text = (text || '').trim();
    if (!text.includes('(')) text = `(${text}`;
    if (!text.includes(')')) text = `${text})`;
    return text;
  },
} as const;
