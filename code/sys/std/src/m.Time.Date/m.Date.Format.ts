import { format, formatDistance, formatRelative, subDays } from 'date-fns';
import { type t } from './common.ts';

/**
 * Library: Tools for formatting dates.
 */
export const Format: t.Date.Format.Lib = Object.freeze({
  toString: format,
  distance: formatDistance,
  relative: formatRelative,
  subDays,
});
