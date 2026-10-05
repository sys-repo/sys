import type { t } from '../common.ts';

/** Remove an exact leading prefix once when present. */
export const stripPrefixOnce: t.Str.Lib['stripPrefixOnce'] = (str = '', prefix) => {
  if (!prefix) return str;
  return str.startsWith(prefix) ? str.slice(prefix.length) : str;
};

/** Remove the final segment from a slash-delimited string. */
export const stripTrailingPathSegment: t.Str.Lib['stripTrailingPathSegment'] = (str = '') => {
  const index = str.lastIndexOf('/');
  return index === -1 ? '' : str.slice(0, index);
};
