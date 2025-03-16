import type { t } from './common.ts';
import { parseTimes } from './u.timestamp.parse.ts';

/**
 * Check if a given timestamp is the current one based on the elapsed time.
 *
 * @param currentTime - The current elapsed time in seconds.
 * @param timestamp - The timestamp string to check (format "HH:MM:SS.mmm").
 * @param timestamps - An object mapping timestamp strings to their properties.
 * @returns true if the provided timestamp is the current one, otherwise false.
 */
export function isCurrentTimestamp(
  currentTime: t.Secs,
  timestamp: t.StringTimestamp,
  timestamps: t.VideoTimestamps,
): boolean {
  const parsedTimes = parseTimes(timestamps);
  let candidate: t.VideoTimestamp | undefined = undefined;

  // Find the last timestamp with total time <= currentTime.
  for (const entry of parsedTimes) {
    if (entry.total.secs <= currentTime) {
      candidate = entry;
    } else {
      break;
    }
  }

  return candidate ? candidate.timestamp === timestamp : false;
}
