import { type t, StdDate } from './common.ts';
import { Format } from './m.Date.u.Format.ts';
import { Day } from './m.Dates.u.Day.ts';
import { Is } from './m.Dates.u.Is.ts';

const { DAY, HOUR, MINUTE, SECOND, WEEK } = StdDate;
const { parse, difference } = StdDate;

export { Day, Format };

/**
 * Library: Tools for working with Dates.
 */
export const Dates: t.DatesLib = {
  Is: Is,
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
