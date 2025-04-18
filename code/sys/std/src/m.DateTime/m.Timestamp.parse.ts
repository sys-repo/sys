import { type t, isRecord } from './common.ts';
import { Duration } from './m.Time.Duration.ts';

/**
 * Parse a "HH:MM:DD:mmm" string into a structured object.
 */
export function parseTime(
  timestamp: t.StringTimestamp,
  options: { round?: number } = {},
): t.TimeDuration {
  // Split the timestamp into "hour", "minute", and "second.millisecond" parts.
  const parts = timestamp.split(':');
  if (parts.length !== 3) throw new Error(`Invalid time format: ${timestamp}`);

  // Parse hours and minutes.
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  // Split the seconds and milliseconds (expected format "SS.mmm").
  const timeParts = parts[2].split('.');
  if (timeParts.length !== 2) {
    throw new Error(`Invalid seconds/milliseconds format: ${parts[2]}`);
  }
  const seconds = parseInt(timeParts[0], 10);
  const milliseconds = parseInt(timeParts[1], 10);

  // Check that all parts are valid numbers.
  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || isNaN(milliseconds)) {
    throw new Error(`Invalid number in timestamp: ${timestamp}`);
  }

  // Calculate the total milliseconds.
  const msecs =
    hours * 3_600_000 + // 1 hour   = 3,600,000 msecs
    minutes * 60_000 + //  1 minute = 60,000 msecs
    seconds * 1_000 + //   1 second = 1,000 msecs
    milliseconds;

  const { round } = options;
  return Duration.create(msecs, { round });
}

/**
 * Convert the set of { "HH:MM:SS:mmm":<value> } timestamp
 * strings into list of sorted stuctures.
 */
export function parseMap<T>(
  timestamps: t.Timestamps<T>,
  options: { round?: number; ensureZero?: boolean } = {},
): t.Timestamp<T>[] {
  if (!isRecord(timestamps)) return [];

  const ZERO = '00:00:00.000';
  if (options.ensureZero && !timestamps[ZERO]) {
    timestamps = { ...timestamps, [ZERO]: {} as T };
  }

  const parse = (timestamp: string, data: T) => {
    const total = parseTime(timestamp, options);
    return {
      timestamp,
      data,
      get total() {
        return total;
      },
    };
  };
  return Object.entries(timestamps)
    .map(([timestamp, data]) => parse(timestamp, data))
    .sort((a, b) => a.total.sec - b.total.sec);
}
