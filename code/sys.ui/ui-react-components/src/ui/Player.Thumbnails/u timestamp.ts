import { type t, Timestamp as Std } from './common.ts';

const round = 3;
const unit = 'secs';

/**
 * Check if a given timestamp is the current one based on the elapsed time.
 */
function isCurrent(
  timestamps: t.VideoTimestamps,
  timestamp: t.StringTimestamp,
  currentTime: t.Secs,
): boolean {
  return Std.isCurrent(timestamps, timestamp, currentTime, { unit, round });
}

/**
 * Lookup a timestamp given the current elapsed time.
 */
function find(timestamps: t.VideoTimestamps, elapsed: t.Secs): t.VideoTimestampData | undefined {
  return Std.find(timestamps, elapsed, { unit, round });
}

/**
 * Convert the set of { "HH:MM:SS:mmm":<value> } timestamp
 * strings into list of sorted stuctures.
 */
function parseTimes(timestamps?: t.VideoTimestamps): t.VideoTimestamp[] {
  return Std.parse<t.VideoTimestampData>(timestamps, { round });
}

/**
 * Parse a "HH:MM:DD:mmm" string.
 */
function parseTime(timestamp: string): t.TimeDuration {
  return Std.parse(timestamp, { round });
}

/**
 * Generate a sub-range for a timestamp within a map of timestamps.
 */
function range(timestamps: t.VideoTimestamps | undefined, location: t.Secs | t.StringTimestamp) {
  if (!timestamps) return undefined;
  return Std.range(timestamps, location, { unit, round });
}

export const Timestamp = {
  parseTime,
  parseTimes,
  isCurrent,
  find,
  range,
  toString(input: t.VideoTimestamp | string) {
    const d = typeof input === 'string' ? input : input.total;
    return Std.toString(d);
  },
} as const;
