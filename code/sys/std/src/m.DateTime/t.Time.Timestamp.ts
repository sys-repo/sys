import type { t } from './common.ts';

export type TimestampUnit = 'msecs' | 'secs';

/**
 * Tools for working with timestamps ("HH:MM:SS.mmm").
 */
export type TimestampLib = {
  /**
   * Convert a parsed [TimeDuration] back into a timestamp ("HH:MM:SS.mmm")
   */
  toString(input: t.TimeDuration | t.StringTimestamp): string;

  /**
   * Determine if the given string is a valid timestamp format.
   *
   * @param input    The string to test, e.g. "HH:MM:SS.mmm"
   * @param options  { strict?: boolean }
   *                 - strict (default `true`): enforces exactly two digits for MM and SS, and exactly three for mmm
   *                 - loose  (strict = `false`): allows 1–2 digits for MM/SS and 1–3 digits for mmm
   */
  isValid(input?: t.StringTimestamp, options?: { strict?: boolean }): input is t.StringTimestamp;

  /**
   * Parse a "HH:MM:DD:mmm" string into a structured object.
   */
  parse(
    timestamp: t.StringTimestamp,
    options?: { round?: number; strict?: boolean },
  ): t.TimeDuration;

  /**
   * Convert the map of { "HH:MM:SS:mmm": <T> } timestamps
   * into a sorted list stuctured objects.
   */
  parse<T>(
    timestamps?: t.Timestamps<T>,
    options?: { round?: number; ensureZero?: boolean },
  ): t.Timestamp<T>[];

  /**
   * Lookup a timestamp from an elapsed time within a {timestamps} map.
   */
  find<T>(
    timestamps: t.Timestamps<T>,
    time: number,
    options?: { unit?: t.TimestampUnit; round?: number },
  ): t.Timestamp<T> | undefined;

  /**
   * Check if a given timestamp is the current one within a set based on the given time.
   */
  isCurrent<T>(
    timestamps: t.Timestamps<T>,
    timestamp: t.StringTimestamp,
    time: t.NumberTime,
    options?: { unit?: t.TimestampUnit; round?: number },
  ): boolean;

  /**
   * Generate a sub-range for a timestamp within a map of timestamps.
   */
  range<T>(
    timestamps: t.Timestamps<T>,
    location: t.NumberTime | t.StringTimestamp,
    options?: { unit?: t.TimestampUnit; round?: number },
  ): TimestampRange | undefined;
};

/**
 * A timestamp range (start/end).
 */
export type TimestampRange = {
  readonly start: t.StringTimestamp;
  readonly end: t.StringTimestamp;
  progress(time: t.NumberTime, options?: { unit?: t.TimestampUnit }): t.Percent;
};
