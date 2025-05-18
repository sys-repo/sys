import type { t } from './common.ts';
import { Duration } from './m.Time.Duration.ts';
import { timer } from './m.Time.Timer.ts';
import { delay } from './m.Time.delay.ts';
import { until } from './m.Time.until.ts';
import { utc } from './m.Time.utc.ts';
import { wait } from './m.Time.wait.ts';

/**
 * Library: Helpers for working with time and timers (delays).
 */
export const Time: t.TimeLib = {
  get now() {
    return utc();
  },

  utc,
  delay,
  wait,
  until,

  Duration,
  duration: Duration.create,
  elapsed: Duration.elapsed,
  timer,
};
