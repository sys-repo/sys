import type { t } from './common.ts';
import { mock } from './m.mock.ts';

/**
 * Fetch test fixtures for Web Standards runtimes.
 */
export const Fetch: t.WebFixture.Fetch.Lib = {
  mock,
};
