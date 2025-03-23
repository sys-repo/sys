import { type t } from './common.ts';

export function createContext(args: {
  rules: t.CssDomRules;
  kind: t.CssDomContextBlock['kind'];
  condition: string;
}): t.CssDomContextBlock {
  const { rules, kind } = args;
  const condition = wrangle.condition(args.condition);

  const api: t.CssDomContextBlock = {
    kind,
    condition,
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
