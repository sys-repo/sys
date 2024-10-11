import type { t } from '../common.ts';
import { Bdd } from './m.Bdd.ts';
import { slug } from '../m.Id/mod.ts';
import { randomPort } from './u.ts';

export { describe, expect, it } from './m.Bdd.ts';

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
};
