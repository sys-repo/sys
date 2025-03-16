import { type t, isRecord } from './common.ts';
import { parseMap, parseTime } from './m.Timestamp.parse.ts';

/**
 * Tools for working with timestamps ("HH:MM:SS.mmm").
 */
export const Timestamp: t.TimestampLib = {
  parse(input: any) {
    if (isRecord(input)) return parseMap(input) as any; // NB: type-hack.
    if (typeof input === 'string') return parseTime(input);
    throw new Error(`Input type not supported: ${typeof input}`);
  },

  find<T>(timestamps: t.Timestamps<T>, msecs: t.Msecs): T | undefined {
    const parsedTimes = parseMap(timestamps);
    let candidate: t.Timestamp<T> | undefined = undefined;
    for (const entry of parsedTimes) {
      // Match the last timestamp with time <= elapsed.
      if (entry.total.msec <= msecs) candidate = entry;
      else break;
    }
    return candidate?.data;
  },
};
