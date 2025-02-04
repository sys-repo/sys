import type * as StdSemver from '@std/semver';
import type { t } from '../common.ts';

/**
 * Tools for working with Semver ("Semantic Versions").
 */
export type SemverLib = {
  /** Semver value assertions. */
  readonly Is: SemverIsLib;

  /** Information about SemVerRelease */
  readonly Release: t.SemverReleaseLib;

  /** Helpers for extracting the modifier prefix of a semver (eg "^" or ">=" etc). */
  readonly Prefix: t.SemverPrefixLib;

  /** Attempt to parse a string as a semantic version, returning a SemVer object. */
  parse: typeof StdSemver.parse;

  /** Coerce a partial semver string into a complete semver. */
  coerce(input?: string): t.SemverCoerceResponse;

  /** Returns the new SemVer resulting from an increment by release type. */
  increment: typeof StdSemver.increment;

  /** Compare two SemVers. */
  compare: typeof StdSemver.compare;

  /** Sort a list of versions. */
  sort(input: t.StringSemver[], options?: SemverSortOptionsInput): t.StringSemver[];
  sort(input: t.SemVer[], options?: SemverSortOptionsInput): t.SemVer[];

  /** Format SemVer object into a string.  */
  toString(input: t.SemVer | t.StringSemver): t.StringSemver;
};

/** Options for the `Semver.sort` method. */
export type SemverSortOptions = { order?: t.SortOrder };
export type SemverSortOptionsInput = t.SemverSortOptions | t.SortOrder;

/** Response from the `Semver.coerce` method. */
export type SemverCoerceResponse = {
  version: t.StringSemver;
  error?: t.StdError;
};

/**
 * Library: Semver value assertions.
 */
export type SemverIsLib = {
  /** Checks to see if value is a valid SemVer object. */
  valid(input?: t.SemVer | string): boolean;

  /** Equality comparison between two SemVers. */
  eql: typeof StdSemver.equals;

  /** Greater than comparison between two SemVers. */
  greaterThan: typeof StdSemver.greaterThan;

  /** Greater than or equal to comparison between two SemVers. */
  greaterOrEqual: typeof StdSemver.greaterOrEqual;

  /** Check if the SemVer is greater than the range. */
  greaterThanRange: typeof StdSemver.greaterThanRange;

  /** Less than comparison between two SemVers. */
  lessThan: typeof StdSemver.lessThan;

  /** Less than or equal to comparison between two SemVers. */
  lessOrEqual: typeof StdSemver.lessOrEqual;

  /** Check if the SemVer is less than the range. */
  lessThanRange: typeof StdSemver.lessThanRange;
};

/**
 * Information about SemVerRelease
 */
export type SemverReleaseLib = {
  /** List of release types. */
  types: t.SemVerReleaseType[];
};

/**
 * Helpers for extracting the modifier prefix of a semver (eg "^" or ">=" etc).
 */
export type SemverPrefixLib = {
  /** Removes any modifier prefixes from the semver. */
  strip(input: string): t.StringSemver;

};
