import type { t } from './common.ts';

export type TimestampOptions = { unit?: 'msecs' | 'secs' };

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
  parse<T>(timestamps?: t.Timestamps<T>): t.Timestamp<T>[];

  /**
   * Lookup a timestamp from an elapsed time within a {timestamps} map.
   */
  find<T>(timestamps: t.Timestamps<T>, time: number, options?: TimestampOptions): T | undefined;

  /**
   * Check if a given timestamp is the current one based on the elapsed time.
   */
  isCurrent<T>(
    current: number,
    timestamp: t.StringTimestamp,
    timestamps: t.Timestamps<T>,
    options?: TimestampOptions,
  ): boolean;
};
