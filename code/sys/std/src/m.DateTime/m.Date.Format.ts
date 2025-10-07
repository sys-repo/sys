import { format, formatDistance, formatRelative, subDays } from 'date-fns';
import type { DateFormatLib } from './t.ts';

/**
 * Library: Tools for formatting dates.
 */
export const Format: DateFormatLib = {
  toString: format,
  distance: formatDistance,
  relative: formatRelative,
  subDays,
};
