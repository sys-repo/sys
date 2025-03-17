import { type t, isRecord } from './common.ts';
import { parseMap, parseTime } from './m.Timestamp.parse.ts';

/**
 * Tools for working with timestamps ("HH:MM:SS.mmm").
 */
export const Timestamp: t.TimestampLib = {
  parse(input: any) {
    if (input === undefined || input === null) return [];
    if (isRecord(input)) return parseMap(input) as any; // NB: type-hack.
    if (typeof input === 'string') return parseTime(input);
    throw new Error(`Input type not supported: ${typeof input}`);
  },

  find<T>(timestamps: t.Timestamps<T>, time: t.Msecs, options = {}): T | undefined {
    const msecs = wrangle.msecs(time, options);
    const parsedTimes = parseMap(timestamps);
    let candidate: t.Timestamp<T> | undefined = undefined;
    for (const entry of parsedTimes) {
      // Match the last timestamp with time <= elapsed.
      if (entry.total.msec <= msecs) candidate = entry;
      else break;
    }
    return candidate?.data;
  },

  isCurrent<T>(
    current: t.Secs,
    timestamp: t.StringTimestamp,
    timestamps: t.Timestamps<T>,
    options = {},
  ) {
    const msecs = wrangle.msecs(current, options);
    const parsedTimes = parseMap(timestamps);
    let candidate: t.Timestamp<T> | undefined = undefined;

    // Find the last timestamp with total time <= currentTime.
    for (const entry of parsedTimes) {
      if (entry.total.msec <= msecs) {
        candidate = entry;
      } else {
        break;
      }
    }

    return candidate ? candidate.timestamp === timestamp : false;
  },

  toString(input) {
    const duration = isRecord(input) ? input : Timestamp.parse(input);
    const msec = duration.msec;

    // Calculate hours, minutes, seconds and milliseconds from the total milliseconds.
    const hours = Math.floor(msec / 3600000);
    const remainderAfterHours = msec % 3600000;
    const minutes = Math.floor(remainderAfterHours / 60000);
    const remainderAfterMinutes = remainderAfterHours % 60000;
    const seconds = Math.floor(remainderAfterMinutes / 1000);
    const milliseconds = remainderAfterMinutes % 1000;

    // Format with leading zeros.
    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');
    const millisStr = milliseconds.toString().padStart(3, '0');

    return `${hoursStr}:${minutesStr}:${secondsStr}.${millisStr}`;
  },
};

/**
 * Helpers
 */
const wrangle = {
  msecs(value: number, options: t.TimestampOptions = {}) {
    const { unit = 'msecs' } = options;
    if (unit === 'secs') value = value * 1000;
    return value;
  },
} as const;
