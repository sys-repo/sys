import { StdDate, type t } from './common.ts';

/**
 * Library: Tools for working with Day date values.
 */
export const DateIs: t.DateIsLib = {
  leapYear: StdDate.isLeap,
  leapYearUtc: StdDate.isUtcLeap,
};
