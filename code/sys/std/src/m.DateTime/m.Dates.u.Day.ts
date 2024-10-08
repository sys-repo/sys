import { StdDate, type t } from './common.ts';

/**
 * Library: Tools for working with Day date values.
 */
export const Day: t.DayLib = {
  /* Returns the number of the day in the year in the local time zone. */
  ofYear: StdDate.dayOfYear,

  /* Returns the number of the day in the year in UTC time. */
  ofYearUtc: StdDate.dayOfYearUtc,
};
