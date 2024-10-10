import type { t } from './common.ts';

import { Duration } from './m.Time.u.Duration.ts';
import { utc } from './m.Time.u.utc.ts';

/**
 * Starts a timer.
 */
export function timer(start?: Date, options: { round?: number } = {}) {
  let startedAt = start || new Date();
  const api: t.Timer = {
    startedAt,
    reset() {
      startedAt = new Date();
      return api;
    },
    get elapsed() {
      return elapsed(startedAt, options);
    },
  };
  return api;
}

/**
 * Retrieves the elapsed milliseconds from the given date.
 */
export function elapsed(
  from: t.DateTimeInput,
  options: { to?: t.DateTimeInput; round?: number } = {},
): t.TimeDuration {
  const start = utc(from).date;
  const end = options.to ? utc(options.to).date : new Date();
  const msec = end.getTime() - start.getTime();
  const precision = options.round === undefined ? 1 : options.round;
  return Duration.create(msec, { round: precision });
}
