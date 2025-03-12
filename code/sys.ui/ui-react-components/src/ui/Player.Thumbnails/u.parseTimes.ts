import type { t } from './common.ts';

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
