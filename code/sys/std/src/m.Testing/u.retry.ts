import { Time, type t } from './common.ts';

type R = t.TestingLib['retry'];

/**
 * Attempt to run the test function <n>-times before throwing.
 * @throws: if the supplied function fails within the `try n-times` range.
 */
export const retry: R = async (...args: any[]) => {
  const { times, fn, options } = wrangle.retryArgs(args);
  const { silent = false, delay, message = '' } = options;
  if (!fn) return;

  let _lastError;
  for (let attempt = 1; attempt <= times; attempt++) {
    try {
      await fn();
      return; // Success → (exit now) → 🌳.
    } catch (error) {
      /**
       * FAILURE → retry.
       * Suppress error until we exhaust the number of retries.
       */
      _lastError = error;
      if (!silent) {
        let warning = `Attempt ${attempt} failed. ${times - attempt} retries left.`;
        if (message) warning = `${warning}|→ ${message}`;
        console.warn(warning.trim());
      }
      if (typeof delay === 'number') await Time.wait(delay);
    }
  }

  /**
   * All attempts have failed:
   * throw the last encountered error.
   */
  throw _lastError; // → 💥
};

/**
 * Helpers
 */
const wrangle = {
  retryArgs(args: any[]) {
    let fn: t.TestRetryRunner | undefined;
    let options: t.TestRetryOptions = {};

    const times = args[0];
    if (typeof args[1] === 'function') fn = args[1];
    if (typeof args[2] === 'function') fn = args[2];
    if (typeof args[1] === 'object') options = args[1];

    return { times, options, fn };
  },
} as const;
