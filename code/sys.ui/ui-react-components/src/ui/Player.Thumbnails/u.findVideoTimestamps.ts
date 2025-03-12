import type { t } from './common.ts';
import { parseTimes } from './u.parseTimes.ts';

/**
 * Lookup a timestamp given the current elapsed time.
 */
export function findVideoTimestamp(
  timestamps: t.VideoTimestamps,
  elapsed: number,
): t.VideoTimestampProps | undefined {
  const parsedTimes = parseTimes(timestamps);

  // Find the last timestamp with time <= elapsed.
  let candidate: t.VideoTimestampItem | undefined = undefined;
  for (const entry of parsedTimes) {
    if (entry.total.secs <= elapsed) candidate = entry;
    else break;
  }

  return candidate ? timestamps[candidate.timestamp] : undefined;
}
