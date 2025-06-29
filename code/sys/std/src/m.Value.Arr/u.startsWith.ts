import { type t } from '../common.ts';

/**
 * Determine if `subject` begins with `prefix`.
 *
 * Elements are compared with `Object.is` so that **NaN** and
 * `-0` behave the same way JavaScript’s strict equality (`===`) does.
 */
export const startsWith: t.ArrayLib['startsWith'] = <T>(
  subject: readonly T[],
  prefix: readonly T[],
): boolean => {
  if (prefix.length > subject.length) return false;

  for (let i = 0; i < prefix.length; i += 1) {
    if (!Object.is(subject[i], prefix[i])) return false;
  }

  return true;
};
