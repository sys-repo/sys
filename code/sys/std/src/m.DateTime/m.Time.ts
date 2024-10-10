import type { t } from './common.ts';
import { Duration } from './m.Time.u.Duration.ts';
import { elapsed, timer } from './m.Time.u.Timer.ts';
import { delay } from './m.Time.u.delay.ts';
import { until } from './m.Time.u.until.ts';
import { utc } from './m.Time.u.utc.ts';

/**
 * Library: Helpers for working with time and timers (delays).
 */
export const Time: t.TimeLib = {
  get now() {
    return utc();
  },

  utc,
  delay,
  until,
  wait: (msecs) => delay(msecs),

  Duration,
  duration: Duration.create,
  elapsed,
  timer,
};
