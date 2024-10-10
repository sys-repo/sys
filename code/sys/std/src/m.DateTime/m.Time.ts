import type { t } from './common.ts';
import { Duration } from './m.Duration.ts';
import { delay } from './m.Time.u.delay.ts';
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
  wait: (msecs) => delay(msecs),

  Duration,
  duration: Duration.create,
};
