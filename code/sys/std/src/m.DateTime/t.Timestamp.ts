import type { t } from './common.ts';

/**
 * Tools for working with timestamps ("HH:MM:SS.mmm").
 */
export type TimestampLib = {
  /**
   * Parse a "HH:MM:DD:mmm" string into a structured object.
   */
  parse(timestamp: t.StringTimestamp): t.TimeDuration;

  /**
   * Convert the map of { "HH:MM:SS:mmm": <T> } timestamps
   * into a sorted list stuctured objects.
   */
  parse<T>(timestamps: t.Timestamps<T>): t.Timestamp<T>[];

  /**
   * Lookup a timestamp from an elapsed time within a {timestamps} map.
   */
  find<T>(timestamps: t.Timestamps<T>, msecs: t.Msecs): T | undefined;

  /**
   * Check if a given timestamp is the current one based on the elapsed time.
   */
  isCurrent<T>(current: t.Secs, timestamp: t.StringTimestamp, timestamps: t.Timestamps<T>): boolean;
};
