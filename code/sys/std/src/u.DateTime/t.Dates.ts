import type { t, StdDate } from './common.ts';

/**
 * Library: Tools for working with Dates.
 */
export type DatesLib = {
  /* Date value type verification flags. */
  Is: t.DateIsLib;

  /* Tools for working with Day values. */
  Day: t.DayLib;

  /* Parses a date string using the specified format string. */
  parse: typeof StdDate.parse;

  /* Calculates the difference of the 2 given dates in various units. If the units are omitted, it returns the difference in the all available units. */
  difference: typeof StdDate.difference;

  /* The number of milliseconds in a day. */
  DAY: typeof StdDate.DAY;
  /* The number of milliseconds in an hour. */
  HOUR: typeof StdDate.HOUR;
  /* The number of milliseconds in a minute. */
  MINUTE: typeof StdDate.MINUTE;
  /* The number of milliseconds in a second. */
  SECOND: typeof StdDate.SECOND;
  /* The number of milliseconds in a week. */
  WEEK: typeof StdDate.WEEK;
};

/**
 * Library: Tools for working with Day date values.
 */
export type DayLib = {
  ofYear: typeof StdDate.dayOfYear;
  ofYearUtc: typeof StdDate.dayOfYearUtc;
};

/**
 * Library: Date value type verification flags.
 */
export type DateIsLib = {
  leapYear: typeof StdDate.isLeap;
  leapYearUtc: typeof StdDate.isUtcLeap;
};
