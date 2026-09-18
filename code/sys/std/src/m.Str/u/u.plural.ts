import type { t } from '../common.ts';

/** Return the singular or plural form of a word based on a number. */
export const plural: t.Str.Lib['plural'] = (count, singular, plural) => {
  const pluralized = plural || `${singular}s`;
  return count === 1 || count === -1 ? singular : pluralized;
};
