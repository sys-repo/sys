import type { t } from './common.ts';

/**
 * Converts a "camelCase" string to "kebab-case".
 */
export const camelToKebab: t.StrLib['camelToKebab'] = (text) => {
  if (typeof text !== 'string') return '';
  return text.replace(
    /[A-Z]/g,
    (match, offset) => (offset > 0 && text[offset - 1] !== '-' ? '-' : '') + match.toLowerCase(),
  );
};

/**
 * Helpers
 */
export function totalLeadingHyphens(text: string): number {
  const match = text.match(/^(-+)/);
  return match ? match[0].length : 0;
}
