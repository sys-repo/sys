import { isSemVer } from '@std/semver';

import type { t } from './common.ts';
import {
  eql,
  greaterOrEqual,
  greaterThan,
  greaterThanRange,
  lessOrEqual,
  lessThan,
  lessThanRange,
} from './u.compare.ts';
import { parse } from './u.parse.ts';

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
    if (typeof input === 'string') return !parse(input).error;
    return false;
  },

  /**
   * Determine if the given SemVer range is a wildcard (eg. "*" no constraint).
   */
  wildcardRange(input) {
    if (!input || !Array.isArray(input)) return false;
    if (!(input.length === 1 && input[0].length === 1)) return false;
    const range = input[0][0];
    return (
      range.operator === undefined &&
      Number.isNaN(range.major) &&
      Number.isNaN(range.minor) &&
      Number.isNaN(range.patch) &&
      isEmptyArray(range.build) &&
      isEmptyArray(range.prerelease)
    );
  },
};

/**
 * Helpers
 */
function isEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length === 0;
}
