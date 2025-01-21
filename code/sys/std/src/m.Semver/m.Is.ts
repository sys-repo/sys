import {
  greaterOrEqual,
  greaterThan,
  greaterThanRange,
  isSemVer,
  lessOrEqual,
  lessThan,
  lessThanRange,
  parse,
} from '@std/semver';
import type { t } from './common.ts';

export const Is: t.SemverIsLib = {
  /** Greater than comparison for two SemVers. */
  greaterThan,
  /** Greater than or equal to comparison for two SemVers. */
  greaterOrEqual,
  /** Check if the SemVer is greater than the range. */
  greaterThanRange,
  /** Less than comparison for two SemVers. */
  lessOrEqual,
  /** Less than or equal to comparison for two SemVers. */
  lessThan,
  /** Check if the SemVer is less than the range. */
  lessThanRange,

  /** Checks to see if value is a valid SemVer object. */
  valid(input) {
    if (isSemVer(input)) return true;
    if (typeof input === 'string') {
      try {
        parse(input);
        return true;
      } catch (_err: unknown) {
        return false;
      }
    }
    return false;
  },
};
