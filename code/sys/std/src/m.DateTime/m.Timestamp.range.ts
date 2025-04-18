import { type t } from './common.ts';
import { parseMap, parseTime } from './m.Timestamp.parse.ts';

/**
 * Generate a sub-range for a timestamp within a map of timestamps.
 */
export const range: t.TimestampLib['range'] = (timestamps, location, options = {}) => {
  const { unit = 'msecs', round } = options;
  const map = parseMap(timestamps, { round, ensureZero: true });
  const msecs = wrangle.msecs(location, unit);

  // Ensure there are enough timestamps.
  if (map.length < 2) return undefined;

  // Iterate over the sorted timestamps to find where currentTime fits.
  for (let i = 0; i < map.length - 1; i++) {
    const start = map[i].total.msec;
    const end = map[i + 1].total.msec;

    if (msecs >= start && msecs <= end) {
      const api: t.TimestampRange = {
        start: map[i].timestamp,
        end: map[i + 1].timestamp,
        progress(time, opt = {}) {
          const progressTime = wrangle.msecs(time, opt.unit ?? unit, round);
          let prog = (progressTime - start) / (end - start);
          if (round !== undefined) {
            const factor = Math.pow(10, round);
            prog = Math.round(prog * factor) / factor;
          }
          return prog as t.Percent;
        },
      };
      return api;
    }
  }

  // Out-of-range.
  return undefined;
};

/**
 * Helpers
 */
const wrangle = {
  msecs(input: t.NumberTime | t.StringTimestamp, unit: t.TimestampUnit, round?: number): t.Msecs {
    if (typeof input === 'string') {
      return parseTime(input, { round }).msec;
    } else {
      return unit === 'secs' ? input * 1000 : input;
    }
  },
} as const;
