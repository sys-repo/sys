import { parseISO, getUnixTime } from 'date-fns';
import type { t } from './common.ts';
import { Format } from './m.Date.Format.ts';

/**
 * Generate a new UTC datetime instance
 */
export function utc(input?: t.DateTimeInput) {
  const date = wrangle.date(input);
  const res: t.DateTime = {
    get date() {
      return date;
    },
    get timestamp() {
      return date.getTime();
    },
    get unix() {
      return getUnixTime(date);
    },
    format(template?: string) {
      return Format.toString(date, template ?? 'yyyy-MM-dd');
    },
  };
  return res;
}

/**
 * Helpers
 */
const wrangle = {
  date(input?: t.DateTimeInput) {
    if (!input) return new Date();
    if (input instanceof Date) return input;
    return parseISO(String(input));
  },
} as const;
