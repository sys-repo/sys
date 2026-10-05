import type { t } from './common.ts';
import { delay } from './u.delay.ts';
import { MAX } from './u.timerMsecs.ts';

/**
 * Library: policy and behavior for creating cancellable delays.
 */
export const Delay: t.Time.Delay.Lib = Object.freeze({
  MAX,
  create: delay,
});
