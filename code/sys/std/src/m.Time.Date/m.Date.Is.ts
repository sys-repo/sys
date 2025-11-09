import { type t, StdDate } from './common.ts';

/**
 * Library: Tools for working with date/day values.
 */
export const Is: t.DateIsLib = {
  leapYear: StdDate.isLeap,
  leapYearUtc: StdDate.isUtcLeap,
};
