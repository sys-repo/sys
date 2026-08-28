import type { t } from './common.ts';

import { Date } from '../m.Time.Date/mod.ts';
import { Duration } from './m.Time.Duration.ts';
import { Delay } from './u.timer.ts';
import { timer } from './m.Time.Timer.ts';
import { delay } from './m.Time.delay.ts';
import { interval } from './m.Time.interval.ts';
import { until } from './m.Time.until.ts';
import { utc } from './m.Time.utc.ts';
import { wait, waitFor } from './m.Time.wait.ts';

/**
 * Library: Helpers for working with time and timers (delays).
 */
export const Time: t.Time.Lib = Object.freeze({
  Date,
  Delay,

  get now() {
    return utc();
  },

  until,
  utc,
  delay,
  interval,
  wait,
  waitFor,

  Duration,
  duration: Duration.create,
  elapsed: Duration.elapsed,
  timer,
});
