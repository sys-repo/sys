import type { t } from './common.ts';

/**
 * Limit the length of a string inserting ellipsis when needed.
 */
export const shorten: t.StrLib['shorten'] = (
  input: string = '',
  maxLength: number = 10,
  options: { ellipsis?: string } = {},
) => {
  const { ellipsis = '…' } = options;
  const text = String(input);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - ellipsis.length)}${ellipsis}`;
};
