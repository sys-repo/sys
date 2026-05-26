import { type t, StdDate } from './common.ts';

/**
 * Library: Tools for working with date/day values.
 */
export const Is: t.Date.Is.Lib = {
  leapYear: StdDate.isLeap,
  leapYearUtc: StdDate.isUtcLeap,
};
