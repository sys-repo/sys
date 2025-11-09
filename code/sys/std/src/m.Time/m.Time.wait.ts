import type { t } from './common.ts';
import { delay } from './m.Time.delay.ts';

/**
 * Wait for the specified milliseconds
 * (NB: use with `await`.)
 */
export const wait: t.TimeLib['wait'] = (msecs) => {
  return delay(msecs);
};

/**
 * Wait until a predicate resolves truthy or timeout expires.
 * Evaluates `fn` repeatedly using a fixed interval.
 */
export const waitFor: t.TimeLib['waitFor'] = async (fn, options = {}) => {
  const { interval = 30, timeout = 2000 } = options;
  const start = Date.now();
  while (true) {
    const result = await fn();
    if (result) return result;
    if (Date.now() - start > timeout) throw new Error('Time.waitFor: timeout exceeded');
    await delay(interval);
  }
};
