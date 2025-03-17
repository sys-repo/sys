import { type t, Timestamp as Std } from './common.ts';

const round = 3;
const unit = 'secs';

/**
 * Check if a given timestamp is the current one based on the elapsed time.
 */
function isCurrent(
  currentTime: t.Secs,
  timestamp: t.StringTimestamp,
  timestamps: t.VideoTimestamps,
): boolean {
  return Std.isCurrent(currentTime, timestamp, timestamps, { unit, round });
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

export const Timestamp = {
  isCurrent,
  find,
  parseTimes,
  parseTime,
  toString(input: t.VideoTimestamp | string) {
    const d = typeof input === 'string' ? input : input.total;
    return Std.toString(d);
  },
} as const;
