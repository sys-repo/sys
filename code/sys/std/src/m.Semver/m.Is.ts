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
import { eql } from './u.compare.ts';

export const Is: t.SemverIsLib = {
  /** Equality comparison between two SemVers. */
  eql,

  /** Greater than comparison between two SemVers. */
  greaterThan,

  /** Greater than or equal to comparison between two SemVers. */
  greaterOrEqual,

  /** Check if the SemVer is greater than the range. */
  greaterThanRange,

  /** Less than comparison between two SemVers. */
  lessOrEqual,

  /** Less than or equal to comparison between two SemVers. */
  lessThan,

  /** Check if the SemVer is less than the range. */
  lessThanRange,

  /**
   * Checks to see if value is a valid SemVer object.
   */
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
