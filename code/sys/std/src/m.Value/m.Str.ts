import type { t } from './common.ts';

/**
 * Library: Tools for working with strings.
 */
export const Str: t.StrLib = {
  /* Capitalize the given word. */
  capitalize(word) {
    if (typeof word !== 'string') return String(word);
    if (!word) return word;
    return word[0].toLocaleUpperCase() + word.slice(1);
  },
};
