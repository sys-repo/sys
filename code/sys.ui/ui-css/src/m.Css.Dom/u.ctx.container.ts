import { type t } from './common.ts';

/**
 * CSS: @container API
 */
export function createContainer(args: {
  rules: t.CssDomRules;
  condition: string;
}): t.CssDomContainerBlock {
  const { rules } = args;
  const condition = wrangle.condition(args.condition);

  const api: t.CssDomContainerBlock = {
    kind: '@container',
    condition,
    rule(selector, style) {
      const context = api.toString();
      return rules.add(selector, style, { context });
    },
    toString() {
      return `${api.kind} ${condition}`;
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
