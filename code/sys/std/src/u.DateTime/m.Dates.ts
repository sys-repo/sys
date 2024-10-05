import { type t, StdDate } from './common.ts';
import { Day } from './m.Dates.u.Day.ts';
import { DateIs } from './m.Dates.u.Is.ts';

const { DAY, HOUR, MINUTE, SECOND, WEEK } = StdDate;
const { parse, difference } = StdDate;

export { Day };

/**
 * Tools for working with Dates.
 */
export const Dates: t.DatesLib = {
  Is: DateIs,
  Day,

  parse,
  difference,

  DAY,
  HOUR,
  MINUTE,
  SECOND,
  WEEK,
};
