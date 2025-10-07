import { StdDate } from './common.ts';
import type { DayLib } from './t.ts';

/**
 * Library: Tools for working with Day date values.
 */
export const Day: DayLib = {
  /** Returns the number of the day in the year in the local time zone. */
  ofYear: StdDate.dayOfYear,

  /** Returns the number of the day in the year in UTC time. */
  ofYearUtc: StdDate.dayOfYearUtc,
};
