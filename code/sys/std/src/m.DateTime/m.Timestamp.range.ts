import { type t } from './common.ts';
import { parseMap } from './m.Timestamp.parse.ts';

export const range: t.TimestampLib['range'] = (timestamps, location, options = {}) => {
  const { unit = 'msecs', round } = options;
  const map = parseMap(timestamps, { round, ensureZero: true });
  const timeInMsecs = wrangle.msecs(location, unit);

  // Ensure there are enough timestamps.
  if (map.length < 2) return undefined;

  // Iterate over the sorted timestamps to find where currentTime fits.
  for (let i = 0; i < map.length - 1; i++) {
    const startTime = map[i].total.msec;
    const endTime = map[i + 1].total.msec;

    if (timeInMsecs >= startTime && timeInMsecs <= endTime) {
      return {
        start: map[i].timestamp,
        end: map[i + 1].timestamp,
      };
    }
  }

  // Out-of-range.
  return undefined;
};

/**
 * Helpers
 */
const wrangle = {
  msecs(value: number, unit: t.TimestampUnit) {
    return unit === 'secs' ? value * 1000 : value;
  },
} as const;
