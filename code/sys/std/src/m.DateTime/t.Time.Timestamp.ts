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
   * Parse a "HH:MM:DD:mmm" string into a structured object.
   */
  parse(timestamp: t.StringTimestamp, options?: { round?: number }): t.TimeDuration;

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
  ): T | undefined;

  /**
   * Check if a given timestamp is the current one based on the elapsed time.
   */
  isCurrent<T>(
    timestamps: t.Timestamps<T>,
    timestamp: t.StringTimestamp,
    currentTime: number,
    options?: { unit?: t.TimestampUnit; round?: number },
  ): boolean;

  /**
   * Generate a sub-range for a timestamp within a map of timestamps.
   */
  range<T>(
    timestamps: t.Timestamps<T>,
    location: t.NumberTime,
    options?: { unit?: t.TimestampUnit; round?: number },
  ): TimestampRange | undefined;
};

/**
 * A timestamp range (start/end).
 */
export type TimestampRange = {
  readonly start: t.StringTimestamp;
  readonly end: t.StringTimestamp;
};
