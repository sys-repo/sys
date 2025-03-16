import type { t } from './common.ts';

/**
 * Convert the set of { "HH:MM:SS:mmm":<value> } timestamp
 * strings into list of sorted stuctures.
 */
export function parseTimes(timestamps: t.VideoTimestamps): t.VideoTimestamp[] {
  const parse = (timestamp: string, data: t.VideoTimestampProp) => {
    const total = parseTime(timestamp);
    return { timestamp, total, data };
  };
  return Object.entries(timestamps)
    .map(([timestamp, data]) => parse(timestamp, data))
    .sort((a, b) => a.total.secs - b.total.secs);
}

/**
 * Parse a "HH:MM:DD:mmm" string.
 */
export function parseTime(timestamp: string): t.VideoTimestampTotal {
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
    hours * 3600000 + // 1 hour   = 3,600,000 msecs
    minutes * 60000 + // 1 minute = 60,000 msecs
    seconds * 1000 + //  1 second = 1000 msecs
    milliseconds;

  // Finish up.
  return {
    msecs,
    secs: msecs / 1000,
    mins: msecs / 60000,
    hours: msecs / 3600000,
  };
}
