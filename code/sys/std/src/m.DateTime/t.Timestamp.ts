import type { t } from './common.ts';

/**
 * Tools for working with timestamps ("HH:MM:SS.mmm").
 */
export type TimestampLib = {
  /**
   * Parse a "HH:MM:DD:mmm" string into a structured object.
   */
  parse(input: t.StringTimestamp): t.TimeDuration;

  /**
   * Convert the map of { "HH:MM:SS:mmm": <T> } timestamps
   * into a sorted list stuctured objects.
   */
  parse<T>(input: t.Timestamps<T>): t.Timestamp<T>[];
};
