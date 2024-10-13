import { StdDate, type t } from './common.ts';

/**
 * Library: Tools for working with Day date values.
 */
export const Is: t.DateIsLib = {
  leapYear: StdDate.isLeap,
  leapYearUtc: StdDate.isUtcLeap,
};
