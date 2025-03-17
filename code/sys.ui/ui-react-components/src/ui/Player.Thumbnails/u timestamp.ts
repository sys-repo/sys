import { type t, Timestamp as Std } from './common.ts';

/**
 * Check if a given timestamp is the current one based on the elapsed time.
 */
function isCurrentTimestamp(
  currentTime: t.Secs,
  timestamp: t.StringTimestamp,
  timestamps: t.VideoTimestamps,
): boolean {
  return Std.isCurrent(currentTime, timestamp, timestamps, { unit: 'secs' });
}

/**
 * Lookup a timestamp given the current elapsed time.
 */
function findTimestamp(
  timestamps: t.VideoTimestamps,
  elapsed: t.Secs,
): t.VideoTimestampData | undefined {
  return Std.find(timestamps, elapsed, { unit: 'secs' });
}

/**
 * Convert the set of { "HH:MM:SS:mmm":<value> } timestamp
 * strings into list of sorted stuctures.
 */
function parseTimes(timestamps?: t.VideoTimestamps): t.VideoTimestamp[] {
  return Std.parse<t.VideoTimestampData>(timestamps);
}

/**
 * Parse a "HH:MM:DD:mmm" string.
 */
function parseTime(timestamp: string): t.TimeDuration {
  return Std.parse(timestamp);
}

export const Timestamp = {
  isCurrent: isCurrentTimestamp,
  find: findTimestamp,
  parseTimes,
  parseTime,
} as const;
