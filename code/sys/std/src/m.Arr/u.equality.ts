import type { t } from '../common.ts';

/**
 * Compare two readonly arrays for exact, index-wise equality.
 */
export const equal: t.ArrayLib['equal'] = <T>(a: readonly T[], b: readonly T[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
};
