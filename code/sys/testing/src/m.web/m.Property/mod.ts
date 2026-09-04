import type { t } from './common.ts';
import { isCleanupError, mock } from './m.mock.ts';

/**
 * Exact own-property transaction substrate for runtime fixtures.
 */
export const Property: t.WebFixture.Property.Lib = Object.freeze({
  isCleanupError,
  mock,
});
