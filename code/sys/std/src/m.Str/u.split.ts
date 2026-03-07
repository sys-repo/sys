import type { t } from './common.ts';

/**
 * Split a string into path-like segments.
 *
 * - Splits on one or more forward or back slashes (`/` or `\`)
 * - Removes empty segments
 * - Purely lexical (no path semantics)
 */
export const splitPathSegments: t.StrLib['splitPathSegments'] = (str = '') => {
  if (!str) return [];
  return str.split(/[\\/]+/).filter(Boolean);
};
