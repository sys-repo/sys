import type { t } from './common.ts';
import { Bdd, Time, slug } from './common.ts';
import { randomPort } from './u.ts';

/**
 * Testing helpers.
 */
export const Testing: t.Testing = {
  FALSY: [false, 0, '', null, undefined],
  Bdd,
  slug,

  /**
   * Wait for n-milliseconds
   */
  wait(msecs): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, msecs));
  },

  /**
   * Retrieves a random unused port.
   */
  randomPort,

  /**
   * Attempt to run the test function <n>-times before throwing.
   */
  async retry(...args: any[]) {
    const { times, runTest, options } = wrangle.retryArgs(args);

    if (!runTest) return;
    const { silent = false, delay, message = '' } = options;

    let _lastError;
    for (let attempt = 1; attempt <= times; attempt++) {
      try {
        await runTest();
        return; // SUCCESS: move on (→ exit now).
      } catch (error) {
        // FAILED: Suppress error until we exhaust the number of retries.
        _lastError = error;
        if (!silent) {
          const warning = `Attempt ${attempt} failed. ${times - attempt} retries left.`;
          console.warn(`${warning} ${message}`.trim());
        }
        if (typeof delay === 'number') {
          await Time.delay(delay);
        }
      }
    }

    // All attempts have failed: throw the last encountered error.
    throw _lastError;
  },
};

/**
 * Helpers
 */
const wrangle = {
  retryArgs(args: any[]) {
    let runTest: t.RetryRunner | undefined;
    let options: t.RetryOptions = {};

    const times = args[0];
    if (typeof args[1] === 'function') runTest = args[1];
    if (typeof args[2] === 'function') runTest = args[2];
    if (typeof args[1] === 'object') options = args[1];

    return { times, runTest, options };
  },
} as const;
