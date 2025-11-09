import { parseISO } from 'date-fns';
import { Format } from '../m.Time.Date/m.Date.Format.ts';
import type { t } from './common.ts';

/**
 * Generate a new UTC datetime instance:
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
    format(template?: string) {
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
    if (!input) return new Date();
    if (input instanceof Date) return input;
    return parseISO(String(input));
  },
} as const;
