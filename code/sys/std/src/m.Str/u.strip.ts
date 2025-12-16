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
