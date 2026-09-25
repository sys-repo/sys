import { Is, type t } from '../common.ts';
import { delay } from '../m.Delay/u.delay.ts';
import { createWaitFor } from './u.waitFor.ts';

/**
 * Wait for the specified milliseconds
 * (NB: use with `await`.)
 */
export const wait: t.Time.Lib['wait'] = (msecs, options = {}) => {
  const opts = Is.abortSignal(options) ? { signal: options } : options;
  return delay(msecs, opts);
};

/**
 * Observe a predicate until a truthy result, abort, failure, or monotonic deadline.
 * Terminating the observation window does not terminate caller-owned predicate work.
 */
export const waitFor: t.Time.Lib['waitFor'] = (fn, options) => createWaitFor(fn, options);
