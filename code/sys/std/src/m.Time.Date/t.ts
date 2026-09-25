import type { t } from './common.ts';

/**
 * Calendar helpers and local-zone date labels.
 */
export declare namespace Date {
  /** Calendar queries, date labels, and fixed millisecond units. */
  export type Lib = {
    /** Calendar-year predicates. */
    readonly Is: Is.Lib;

    /** Day-of-year helpers. */
    readonly Day: Day.Lib;

    /** Date labels and calendar-day subtraction. */
    readonly Format: Format.Lib;

    /** Compatibility alias of `Format.toString`. */
    readonly format: Format.Lib['toString'];

    /** Parse a local date using a numeric-field pattern, such as 'yyyy-MM-dd HH:mm'. */
    readonly parse: (input: string, pattern: string) => globalThis.Date;

    /** Absolute difference in selected units (default: all); months use local calendar fields. */
    readonly difference: (
      from: globalThis.Date,
      to: globalThis.Date,
      options?: DifferenceOptions,
    ) => Difference;

    /** Exactly 86,400,000 milliseconds; a local calendar day may differ across DST. */
    readonly DAY: t.Msecs;
    /** Exactly 3,600,000 milliseconds. */
    readonly HOUR: t.Msecs;
    /** Exactly 60,000 milliseconds. */
    readonly MINUTE: t.Msecs;
    /** Exactly 1,000 milliseconds. */
    readonly SECOND: 1000;
    /** Exactly seven 24-hour days in milliseconds. */
    readonly WEEK: t.Msecs;
  };

  /** Units available from calendar-date differences, distinct from duration-string suffixes. */
  export type DifferenceUnit =
    | 'milliseconds'
    | 'seconds'
    | 'minutes'
    | 'hours'
    | 'days'
    | 'weeks'
    | 'months'
    | 'quarters'
    | 'years';

  /** Units to calculate; omission selects all units. */
  export type DifferenceOptions = { units?: DifferenceUnit[] };

  /** Selected difference fields; unrequested fields are absent. */
  export type Difference = Readonly<Partial<Record<DifferenceUnit, number>>>;

  /**
   * Day-of-year helpers.
   */
  export namespace Day {
    /** One-based day numbers in the selected zone. */
    export type Lib = {
      /** Day of the year using local calendar fields. */
      readonly ofYear: (date: globalThis.Date) => number;
      /** Day of the year using UTC calendar fields. */
      readonly ofYearUtc: (date: globalThis.Date) => number;
    };
  }

  /**
   * Calendar-year predicates.
   */
  export namespace Is {
    /** Numeric inputs are calendar years, not Unix timestamps. */
    export type Lib = {
      /** Whether the numeric year or Date's local year is a leap year. */
      readonly leapYear: (year: globalThis.Date | number) => boolean;
      /** Whether the numeric year or Date's UTC year is a leap year. */
      readonly leapYearUtc: (year: globalThis.Date | number) => boolean;
    };
  }

  /**
   * Local-zone date labels and calendar-day subtraction.
   * Formatting uses date-fns tokens and its default locale. Locale and date-construction extensions
   * are not part of this public contract.
   */
  export namespace Format {
    /** Date labels and non-mutating calendar-day subtraction. */
    export type Lib = {
      /**
       * Format local calendar fields using date-fns tokens.
       * Invalid dates throw RangeError; pattern errors propagate unchanged.
       */
      readonly toString: (date: Input, pattern: string) => string;

      /** Distance in words; invalid dates throw RangeError. */
      readonly distance: (date: Input, baseDate: Input, options?: DistanceOptions) => string;

      /** Label relative to the supplied base date; invalid dates throw RangeError. */
      readonly relative: (date: Input, baseDate: Input) => string;

      /** A new Date with local calendar days subtracted; invalid input yields an invalid Date. */
      readonly subDays: (date: Input, amount: number) => globalThis.Date;
    };

    /** Date, Unix milliseconds, or a string interpreted by native Date construction. */
    export type Input = globalThis.Date | t.UnixTimestamp | string;

    /** Controls whether a distance includes its direction. */
    export type DistanceOptions = {
      /** Include a past or future qualifier (default: false). */
      addSuffix?: boolean;
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
  readonly format: (template?: string) => string;
};

/** Unix milliseconds, an ISO string, or a Date copied when creating the instance. */
export type DateTimeInput = number | string | Date;
