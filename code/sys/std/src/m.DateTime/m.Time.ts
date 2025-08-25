import type { TimeLib } from './t.ts';

import { Duration } from './m.Time.Duration.ts';
import { timer } from './m.Time.Timer.ts';
import { delay } from './m.Time.delay.ts';
import { until } from './m.Time.until.ts';
import { utc } from './m.Time.utc.ts';
import { wait } from './m.Time.wait.ts';
import { nextFrame, doubleFrame } from './m.Time.frame.ts';

/**
 * Library: Helpers for working with time and timers (delays).
 */
export const Time: TimeLib = {
  get now() {
    return utc();
  },

  until,
  utc,
  delay,
  wait,
  nextFrame,
  doubleFrame,

  Duration,
  duration: Duration.create,
  elapsed: Duration.elapsed,
  timer,
};
