import type { t } from './common.ts';

import { Date } from '../m.Time.Date/mod.ts';
import { Delay } from './m.Delay/mod.ts';
import { Duration } from './m.Duration/mod.ts';
import { interval } from './u/u.interval.ts';
import { timer } from './u/u.timer.ts';
import { until } from './u/u.until.ts';
import { utc } from './u/u.utc.ts';
import { wait, waitFor } from './u/u.wait.ts';

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
  delay: Delay.create,
  interval,
  wait,
  waitFor,

  Duration,
  duration: Duration.create,
  elapsed: Duration.elapsed,
  timer,
});
