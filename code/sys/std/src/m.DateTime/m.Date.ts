import { type t, StdDate } from './common.ts';
import { Day } from './m.Date.Day.ts';
import { Format } from './m.Date.Format.ts';
import { Is } from './m.Date.Is.ts';

const { DAY, HOUR, MINUTE, SECOND, WEEK } = StdDate;
const { parse, difference } = StdDate;

export { Day, Format };

/**
 * Library: Tools for working with Dates.
 */
export const Date: t.DateLib = {
  Is,
  Day,
  Format,
  format: Format.toString,

  parse,
  difference,

  DAY,
  HOUR,
  MINUTE,
  SECOND,
  WEEK,
};
