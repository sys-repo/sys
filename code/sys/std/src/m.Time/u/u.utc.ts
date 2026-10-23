import { parseISO } from 'date-fns';
import { Format } from '../../m.Time.Date/m.Date.Format.ts';
import { Is, type t } from '../common.ts';

/**
 * Create a date-time snapshot. Despite the name, formatting uses the local time zone.
 */
export function utc(input?: t.DateTimeInput) {
  const date = wrangle.date(input);
  const res: t.DateTime = {
    get date() {
      return new Date(date);
    },
    get timestamp() {
      return date.getTime();
    },
    format(template?: string) {
      if (!Is.num(date.getTime())) throw new RangeError('Time.utc: invalid date');
      return Format.toString(date, template ?? 'yyyy-MM-dd');
    },
  };
  return res;
}

/**
 * Helpers:
 */
const wrangle = {
  date(input?: t.DateTimeInput) {
    if (input === undefined) return new Date();
    if (Is.str(input)) return parseISO(input);
    return new Date(input);
  },
} as const;
