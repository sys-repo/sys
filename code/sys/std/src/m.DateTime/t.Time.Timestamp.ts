import type { t } from './common.ts';

export type TimestampUnit = 'msecs' | 'secs';

/**
 * Tools for working with timestamps ("HH:MM:SS.mmm").
 */
export type TimestampLib = {
  /**
   * Parse a "HH:MM:DD:mmm" string into a structured object.
   */
  parse(timestamp: t.StringTimestamp, options?: { round?: number }): t.TimeDuration;

  /**
   * Convert the map of { "HH:MM:SS:mmm": <T> } timestamps
   * into a sorted list stuctured objects.
   */
  parse<T>(timestamps?: t.Timestamps<T>, options?: { round?: number }): t.Timestamp<T>[];

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
    current: number,
    timestamp: t.StringTimestamp,
    timestamps: t.Timestamps<T>,
    options?: { unit?: t.TimestampUnit; round?: number },
  ): boolean;

  /**
   * Convert a parsed [TimeDuration] back into a timestamp ("HH:MM:SS.mmm")
   */
  toString(input: t.TimeDuration | t.StringTimestamp): string;
};
