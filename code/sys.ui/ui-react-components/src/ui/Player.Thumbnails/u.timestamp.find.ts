import type { t } from './common.ts';
import { parseTimes } from './u.timestamp.parse.ts';

/**
 * Lookup a timestamp given the current elapsed time.
 */
export function findTimestamp(
  timestamps: t.VideoTimestamps,
  elapsed: t.Secs,
): t.VideoTimestampProps | undefined {
  const parsedTimes = parseTimes(timestamps);

  // Find the last timestamp with time <= elapsed.
  let candidate: t.VideoTimestamp | undefined = undefined;
  for (const entry of parsedTimes) {
    if (entry.total.secs <= elapsed) candidate = entry;
    else break;
  }

  return candidate ? timestamps[candidate.timestamp] : undefined;
}
