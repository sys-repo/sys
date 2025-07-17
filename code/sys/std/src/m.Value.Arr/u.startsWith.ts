import type { t } from '../common.ts';
import { equal } from './u.equality.ts';

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
  return prefix.length <= subject.length && equal(subject.slice(0, prefix.length), prefix);
};
