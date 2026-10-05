import { slug, type t } from './common.ts';
import { randomPort, retry, waitUntil } from './u.ts';

/**
 * Testing helpers.
 */
export const Testing: t.Testing.Lib = Object.freeze({
  FALSY: [false, 0, '', null, undefined],
  slug,

  /**
   * Wait for n-milliseconds.
   */
  wait(msecs): Promise<void> {
    if (msecs === undefined) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, msecs));
  },

  /**
   * Retrieves a random unused port.
   */
  randomPort,

  /**
   * Attempt to run the test function <n>-times before throwing.
   * @throws: if the supplied function fails within the `try n-times` range.
   */
  retry,
  until: waitUntil,
});
