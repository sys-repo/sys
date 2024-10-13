import type { t } from './common.ts';

/**
 * Return the "singular" or "plural" version of a word based on a number.
 */
export const plural: t.TextLib['plural'] = (count, singular, plural) => {
  plural = plural ? plural : `${singular}s`;
  return count === 1 || count === -1 ? singular : plural;
};
