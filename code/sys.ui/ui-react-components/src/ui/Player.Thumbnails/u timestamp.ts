import { type t, Timestamp } from './common.ts';

/**
 * Check if a given timestamp is the current one based on the elapsed time.
 */
export function isCurrentTimestamp(
  currentTime: t.Secs,
  timestamp: t.StringTimestamp,
  timestamps: t.VideoTimestamps,
): boolean {
  return Timestamp.isCurrent(currentTime, timestamp, timestamps, { unit: 'secs' });
}

/**
 * Lookup a timestamp given the current elapsed time.
 */
export function findTimestamp(
  timestamps: t.VideoTimestamps,
  elapsed: t.Secs,
): t.VideoTimestampData | undefined {
  return Timestamp.find(timestamps, elapsed, { unit: 'secs' });
}

/**
 * Convert the set of { "HH:MM:SS:mmm":<value> } timestamp
 * strings into list of sorted stuctures.
 */
export function parseTimes(timestamps?: t.VideoTimestamps): t.VideoTimestamp[] {
  return Timestamp.parse<t.VideoTimestampData>(timestamps);
}

/**
 * Parse a "HH:MM:DD:mmm" string.
 */
export function parseTime(timestamp: string): t.TimeDuration {
  return Timestamp.parse(timestamp);
}
