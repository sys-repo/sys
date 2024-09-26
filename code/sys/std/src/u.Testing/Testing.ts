import type { t } from '../common.ts';
import { Bdd } from './Testing.Bdd.ts';

export { describe, expect, it } from './Testing.Bdd.ts';

/**
 * Testing helpers.
 */
export const Testing: t.Testing = {
  Bdd,

  /**
   * Wait for
   */
  wait(msecs): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, msecs));
  },
};
