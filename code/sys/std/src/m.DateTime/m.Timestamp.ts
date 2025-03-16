import { type t } from './common.ts';
import { parseTime } from './m.Timestamp.parse.ts';

/**
 * Tools for working with timestamps ("HH:MM:SS.mmm").
 */
export const Timestamp: t.TimestampLib = {
  parse(input) {
    return parseTime(input);
    throw new Error(`Input type not supported: ${typeof input}`);
  },
};
