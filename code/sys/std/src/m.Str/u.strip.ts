import type { t } from './common.ts';

/**
 * Remove a leading prefix from a string exactly once, if present.
 *
 * - Purely lexical (no path or URL semantics)
 * - Removes the prefix only if it is an exact leading match
 * - Never removes more than once
 * - Safe for undefined / empty input
 */
export const stripPrefixOnce: t.StrLib['stripPrefixOnce'] = (str = '', prefix) => {
  if (!prefix) return str;
  return str.startsWith(prefix) ? str.slice(prefix.length) : str;
};

/**
 * Remove the final path segment from a slash-delimited string.
 *
 * - Purely lexical (not filesystem- or URL-semantic)
 * - Removes everything after the last `/`
 * - Preserves leading structure
 * - Safe for undefined / empty input
 */
export const stripTrailingPathSegment: t.StrLib['stripTrailingPathSegment'] = (str = '') => {
  const i = str.lastIndexOf('/');
  return i === -1 ? '' : str.slice(0, i);
};
