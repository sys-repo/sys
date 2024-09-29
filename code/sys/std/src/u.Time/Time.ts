import type { t } from '../common.ts';
import { delay } from './u.delay.ts';

/**
 * Helpers for working with time and timers (delays).
 */
export const Time: t.TimeLib = {
  delay,
  wait: (msecs) => Time.delay(msecs),
};
