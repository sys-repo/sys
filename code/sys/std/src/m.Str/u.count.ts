import { type t } from './common.ts';

/**
 * Count non-overlapping occurrences of a substring.
 */
export const count: t.StrLib['count'] = (text, sub) => {
  return sub === '' ? 0 : text.split(sub).length - 1;
};
