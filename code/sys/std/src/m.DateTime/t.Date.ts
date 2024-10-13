import type { format, formatDistance, formatRelative, subDays } from 'date-fns';
import type { StdDate, t } from './common.ts';

/**
 * Library: Tools for working with Dates.
 */
export type DateLib = {
  /* Tools for working with time. */
  readonly Time: t.TimeLib;

  /* Date value type verification flags. */
  readonly Is: t.DateIsLib;

  /* Tools for working with Day values. */
  readonly Day: t.DayLib;

  /* Tools for formatting dates into "pretty" strings. */
  readonly Format: t.DateFormatLib;

  /* Format date string in the given "pretty" string. The result may vary by locale. */
  format: t.DateFormatLib['toString'];

  /* Parses a date string using the specified format string. */
  parse: typeof StdDate.parse;

  /* Calculates the difference of the 2 given dates in various units. If the units are omitted, it returns the difference in the all available units. */
  difference: typeof StdDate.difference;

  /* The number of milliseconds in a day. */
  readonly DAY: typeof StdDate.DAY;
  /* The number of milliseconds in an hour. */
  readonly HOUR: typeof StdDate.HOUR;
  /* The number of milliseconds in a minute. */
  readonly MINUTE: typeof StdDate.MINUTE;
  /* The number of milliseconds in a second. */
  readonly SECOND: typeof StdDate.SECOND;
  /* The number of milliseconds in a week. */
  readonly WEEK: typeof StdDate.WEEK;
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

/**
 * Library: Tools for formatting dates into "pretty" strings.
 */
export type DateFormatLib = {
  /* Format date string in the given "pretty" string. The result may vary by locale. */
  toString: typeof format;

  /* Return the distance between the given dates in words. */
  distance: typeof formatDistance;

  /* Represent the date in words relative to the given base date. */
  relative: typeof formatRelative;

  /* Subtract the specified number of days from the given date. */
  subDays: typeof subDays;
};

/**
 * Represents an Date/Time value.
 */
export type DateTime = {
  readonly date: Date;
  readonly timestamp: t.UnixTimestamp;
  readonly unix: t.UnixEpoch;
  format(template?: string): string;
};

/* Input values for generating a DateTime instance. */
export type DateTimeInput = number | string | Date;
