import { StdDate } from './common.ts';
import type { DateIsLib } from './t.ts';

/**
 * Library: Tools for working with Day date values.
 */
export const Is: DateIsLib = {
  leapYear: StdDate.isLeap,
  leapYearUtc: StdDate.isUtcLeap,
};
