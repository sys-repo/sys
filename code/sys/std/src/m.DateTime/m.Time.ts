import type { t } from './common.ts';
import { Duration } from './m.Duration.ts';
import { delay } from './m.Time.u.delay.ts';

/**
 * Library: Helpers for working with time and timers (delays).
 */
export const Time: t.TimeLib = {
  delay,
  wait: (msecs) => delay(msecs),

  Duration,
  duration: Duration.create,
};
