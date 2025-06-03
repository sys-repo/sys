import type { TestingLib } from './t.ts';

import { Bdd, slug } from './common.ts';
import { randomPort, retry } from './u.ts';

/**
 * Testing helpers.
 */
export const Testing: TestingLib = {
  FALSY: [false, 0, '', null, undefined],
  Bdd,
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
};
