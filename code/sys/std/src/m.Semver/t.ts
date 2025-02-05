import type * as Std from '@std/semver';
import type { t } from '../common.ts';

/**
 * A type representing a semantic version range. The ranges consist of a nested array, which
 * represents a set of OR comparisons while the inner array represents AND comparisons.
 */
export type SemverRange = Std.Range;

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
  parse(input?: string): t.SemverParseResponse;

  /** Coerce a partial semver string into a complete semver. */
  coerce(input?: string): t.SemverCoerceResponse;

  /** Attempt to parse a SemVer range (eg ">=1.0.0 <2.0.0 || >=3.0.0"). */
  range(input?: string): t.SemverRangeResponse;

  /** Returns the new SemVer resulting from an increment by release type. */
  increment: typeof Std.increment;

  /** Compare two SemVers. */
  compare: typeof Std.compare;

  /** Sort a list of versions. */
  sort(input: t.StringSemver[], options?: SemverSortOptionsInput): t.StringSemver[];
  sort(input: t.Semver[], options?: SemverSortOptionsInput): t.Semver[];

  /** Format SemVer object into a string.  */
  toString(input: t.Semver | t.StringSemver): t.StringSemver;
};

/** Options for the `Semver.sort` method. */
export type SemverSortOptions = { order?: t.SortOrder };
export type SemverSortOptionsInput = t.SemverSortOptions | t.SortOrder;

/** Response from the `Semver.parse` method. */
export type SemverParseResponse = {
  version: t.Semver;
  error?: t.StdError;
};

/** Response from the `Semver.coerce` method. */
export type SemverCoerceResponse = {
  version: t.StringSemver;
  error?: t.StdError;
};

/** Response from the `Semver.coerce` method. */
export type SemverRangeResponse = {
  range: t.SemverRange;
  error?: t.StdError;
};

/**
 * Library: Semver value assertions.
 */
export type SemverIsLib = {
  /** Checks to see if value is a valid SemVer object. */
  valid(input?: t.Semver | string): boolean;

  /** Equality comparison between two SemVers. */
  eql(a: t.Semver | string, b: t.Semver | string): boolean;

  /** Greater than comparison between two SemVers. */
  greaterThan(a: t.Semver | string, b: t.Semver | string): boolean;

  /** Greater than or equal to comparison between two SemVers. */
  greaterOrEqual(a: t.Semver | string, b: t.Semver | string): boolean;

  /** Check if the SemVer is greater than the range. */
  greaterThanRange(version: t.Semver | string, range: t.SemverRange | string): boolean;

  /** Less than comparison between two SemVers. */
  lessThan(a: t.Semver | string, b: t.Semver | string): boolean;

  /** Less than or equal to comparison between two SemVers. */
  lessOrEqual(a: t.Semver | string, b: t.Semver | string): boolean;

  /** Check if the SemVer is less than the range. */
  lessThanRange(version: t.Semver | string, range: t.SemverRange | string): boolean;

  /** Determine if the given SemVer range is a wildcard (eg. "*" no constraint).  */
  wildcardRange(input?: t.SemverRange): boolean;
};

/**
 * Information about SemVerRelease
 */
export type SemverReleaseLib = {
  /** List of release types. */
  types: t.SemverReleaseType[];
};

/**
 * Helpers for extracting the modifier prefix of a semver (eg "^" or ">=" etc).
 */
export type SemverPrefixLib = {
  /** Removes any modifier prefixes from the semver. */
  strip(input: string): t.StringSemver;

  /** Removes any modifier prefixes from the semver. */
  get(input: string): string;
};
