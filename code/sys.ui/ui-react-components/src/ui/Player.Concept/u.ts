import type { t } from './common.ts';

export function findVideoTimestamp(
  timestamps: t.VideoTimestamps,
  elapsed: number,
): t.VideoTimestamp | undefined {
  const parse = (timestamp: string) => {
    const parts = timestamp.split(':');
    if (parts.length !== 3) throw new Error(`Invalid time format: ${timestamp}`);

    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]); // Split seconds and milliseconds (e.g., "14.000")
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    return { timestamp, totalSeconds };
  };

  const parsedTimes = Object.keys(timestamps)
    .map((timestamp) => parse(timestamp))
    .sort((a, b) => a.totalSeconds - b.totalSeconds);

  // Find the last timestamp with time <= elapsed.
  let candidate: { timestamp: string; totalSeconds: number } | undefined = undefined;
  for (const entry of parsedTimes) {
    if (entry.totalSeconds <= elapsed) candidate = entry;
    else break;
  }

  return candidate ? timestamps[candidate.timestamp] : undefined;
}
