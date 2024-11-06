import type { t } from './common.ts';

/**
 * Capitalize the given word.
 */
export const capitalize: t.StrLib['capitalize'] = (word) => {
  if (typeof word !== 'string') return String(word);
  if (!word) return word;
  return word[0].toLocaleUpperCase() + word.slice(1);
};
