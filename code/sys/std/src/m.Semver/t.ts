import type * as StdSemver from '@std/semver';
import type { t } from '../common.ts';

/**
 * Library: tools for working with Semver ("Semantic Versions").
 */
export type SemverLib = {
  /** Attempt to parse a string as a semantic version, returning a SemVer object. */
  parse: typeof StdSemver.parse;

  /** Returns the new SemVer resulting from an increment by release type. */
  increment: typeof StdSemver.increment;

  /** Compare two SemVers. */
  compare: typeof StdSemver.compare;

  /** Format SemVer object into a string.  */
  toString(input: t.SemVer): string;

  /** Semver value assertions. */
  readonly Is: SemverIsLib;

  /** Tools and information about SemVerRelease */
  readonly Release: t.SemverReleaseLib;
};

/**
 * Library: Semver value assertions.
 */
export type SemverIsLib = {
  /** Checks to see if value is a valid SemVer object. */
  valid(input?: t.SemVer | string): boolean;

  /** Greater than comparison for two SemVers. */
  greaterThan: typeof StdSemver.greaterThan;
  /** Greater than or equal to comparison for two SemVers. */
  greaterOrEqual: typeof StdSemver.greaterOrEqual;
  /** Check if the SemVer is greater than the range. */
  greaterThanRange: typeof StdSemver.greaterThanRange;

  /** Less than comparison for two SemVers. */
  lessThan: typeof StdSemver.lessThan;
  /** Less than or equal to comparison for two SemVers. */
  lessOrEqual: typeof StdSemver.lessOrEqual;
  /** Check if the SemVer is less than the range. */
  lessThanRange: typeof StdSemver.lessThanRange;
};

/**
 * Library: Tools and information about SemVerRelease
 */
export type SemverReleaseLib = {
  types: t.SemVerReleaseType[];
};
