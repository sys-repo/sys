import type { t } from '../common.ts';

import {
  compare,
  format,
  greaterOrEqual,
  greaterThan,
  greaterThanRange,
  increment,
  lessOrEqual,
  lessThan,
  lessThanRange,
  parse,
  isSemVer,
} from '@std/semver';

const Is: t.SemverIsLib = {
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

const Release: t.SemverReleaseLib = {
  types: ['pre', 'major', 'premajor', 'minor', 'preminor', 'patch', 'prepatch', 'prerelease'],
};

export const Semver: t.SemverLib = {
  /** Semver value assertions. */
  Is,

  /** Tools and information about SemVerRelease */
  Release,

  /** Attempt to parse a string as a semantic version, returning a SemVer object. */
  parse,

  /** Returns the new SemVer resulting from an increment by release type. */
  increment,

  /** Compare two SemVers. */
  compare,

  /** Format a SemVer object into a string. */
  toString: format,
};
