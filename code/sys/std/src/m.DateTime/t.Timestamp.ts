import type { t } from './common.ts';

/**
 * Tools for working with timestamps ("HH:MM:SS.mmm").
 */
export type TimestampLib = {
  /**
   * Parse a "HH:MM:DD:mmm" string into a structured object.
   */
  parse(input: t.StringTimestamp): t.TimeDuration;

};
