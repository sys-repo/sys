import { type t, StdDate } from './common.ts';
import { Day } from './m.Date.u.Day.ts';
import { Format } from './m.Date.u.Format.ts';
import { Is } from './m.Date.u.Is.ts';
import { Time } from './m.Time.ts';

const { DAY, HOUR, MINUTE, SECOND, WEEK } = StdDate;
const { parse, difference } = StdDate;

export { Day, Format };

/**
 * Library: Tools for working with Dates.
 */
export const Date: t.DateLib = {
  Time,
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
