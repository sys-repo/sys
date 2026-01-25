import { type t } from './common.ts';

export const textOf: t.MastraMemoryLib['textOf'] = (c: unknown): string => {
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.map(textOf).join('');
  if (c && typeof c === 'object') {
    const anyC = c as any;
    if (Array.isArray(anyC.parts)) return anyC.parts.map(textOf).join('');
    if (typeof anyC.text === 'string') return anyC.text;
    if (typeof anyC.content === 'string') return anyC.content;
  }
  return '';
};
