import type { t } from './common.ts';
import { delay } from './m.Time.delay.ts';

/**
 * Wait for the specified milliseconds
 * (NB: use with `await`.)
 * @param msecs: delay in milliseconds.
 */
export const wait: t.TimeLib['wait'] = (msecs = 0) => {
  return delay(msecs);
};
