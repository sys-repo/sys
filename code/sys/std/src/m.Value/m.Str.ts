import { type t, Str } from './common.ts';

/**
 * Library: Tools for working with strings.
 */
export const String: t.StringLib = {
  /* Capitalize the given word. */
  capitalize(word) {
    if (typeof word !== 'string') return Str(word);
    if (!word) return word;
    return word[0].toLocaleUpperCase() + word.slice(1);
  },
};
