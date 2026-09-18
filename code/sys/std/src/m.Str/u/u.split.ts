import type { t } from '../common.ts';

/**
 * Split a string into lexical path-like segments across forward or back slashes.
 */
export const splitPathSegments: t.Str.Lib['splitPathSegments'] = (str = '') => {
  return str ? str.split(/[\\/]+/).filter(Boolean) : [];
};
