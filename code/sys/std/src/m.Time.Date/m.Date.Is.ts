import { StdDate, type t } from './common.ts';

/**
 * Library: Tools for working with date/day values.
 */
export const Is: t.Date.Is.Lib = Object.freeze({
  leapYear: StdDate.isLeap,
  leapYearUtc: StdDate.isUtcLeap,
});
