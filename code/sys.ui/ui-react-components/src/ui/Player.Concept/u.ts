import type { t } from './common.ts';

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

/**
 * Break the "HH:MM:SS:mmm" string a list of sorted stuctures.
 */
export function parseTimes(timestamps: t.VideoTimestamps): t.VideoTimestampItem[] {
  const parse = (timestamp: string, data: t.VideoTimestampProps): t.VideoTimestampItem => {
    const parts = timestamp.split(':');
    if (parts.length !== 3) throw new Error(`Invalid time format: ${timestamp}`);

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    const [seconds, milliseconds] = parts[2].split('.').map((num) => parseInt(num, 10));
    if (isNaN(seconds) || isNaN(milliseconds)) {
      throw new Error(`Invalid seconds/milliseconds format: ${parts[2]}`);
    }

    const secs = hours * 3600 + minutes * 60 + seconds;
    const msecs = secs * 1000 + milliseconds;

    return {
      timestamp,
      total: { secs, msecs },
      data,
    };
  };

  return Object.entries(timestamps)
    .map(([timestamp, data]) => parse(timestamp, data))
    .sort((a, b) => a.total.msecs - b.total.msecs);
}
