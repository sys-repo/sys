import type { format, formatDistance, formatRelative, subDays } from 'date-fns';
import type { StdDate, t } from './common.ts';

/**
 * Library: Tools for working with Dates.
 */
export declare namespace Date {
  /** Date helper library surface. */
  export type Lib = {
    /** Date value type verification flags. */
    readonly Is: Is.Lib;

    /** Tools for working with Day values. */
    readonly Day: Day.Lib;

    /** Tools for formatting dates into "pretty" strings. */
    readonly Format: Format.Lib;

    /** Format using the host's local zone by default; the result may also vary by locale. */
    format: Format.Lib['toString'];

    /** Parses a date string using the specified format string. */
    parse: typeof StdDate.parse;

    /** Calculates the difference of the 2 given dates in various units. If the units are omitted, it returns the difference in the all available units. */
    difference: typeof StdDate.difference;

    /** The number of milliseconds in a day. */
    readonly DAY: typeof StdDate.DAY;
    /** The number of milliseconds in an hour. */
    readonly HOUR: typeof StdDate.HOUR;
    /** The number of milliseconds in a minute. */
    readonly MINUTE: typeof StdDate.MINUTE;
    /** The number of milliseconds in a second. */
    readonly SECOND: typeof StdDate.SECOND;
    /** The number of milliseconds in a week. */
    readonly WEEK: typeof StdDate.WEEK;
  };

  /**
   * Library: Tools for working with Day date values.
   */
  export namespace Day {
    /** Day helper library surface. */
    export type Lib = {
      ofYear: typeof StdDate.dayOfYear;
      ofYearUtc: typeof StdDate.dayOfYearUtc;
    };
  }

  /**
   * Library: Date value type verification flags.
   */
  export namespace Is {
    /** Date type-guard library surface. */
    export type Lib = {
      leapYear: typeof StdDate.isLeap;
      leapYearUtc: typeof StdDate.isUtcLeap;
    };
  }

  /**
   * Library: Tools for formatting dates into "pretty" strings.
   */
  export namespace Format {
    /** Date formatting helper library surface. */
    export type Lib = {
      /** Format using the host's local zone by default; the result may also vary by locale. */
      toString: typeof format;

      /** Return the distance between the given dates in words. */
      distance: typeof formatDistance;

      /** Represent the date in words relative to the given base date. */
      relative: typeof formatRelative;

      /** Subtract the specified number of days from the given date. */
      subDays: typeof subDays;
    };
  }
}

/** A date-time snapshot; an invalid value has a NaN timestamp. */
export type DateTime = {
  /** A fresh Date copy; mutating it cannot change this instance. */
  readonly date: Date;

  /** Unix milliseconds since 1970-01-01T00:00:00Z, or NaN for an invalid value. */
  readonly timestamp: t.UnixTimestamp;

  /**
   * Format in the host's local zone, defaulting to 'yyyy-MM-dd'.
   * Invalid dates throw RangeError('Time.utc: invalid date'); template errors propagate.
   */
  format(template?: string): string;
};

/** Unix milliseconds, an ISO string, or a Date copied when creating the instance. */
export type DateTimeInput = number | string | Date;
