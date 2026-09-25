import type * as Std from '@std/semver';
import type { Semver as SemverValue } from '@sys/types';
import type { t } from '../common.ts';

/** Semver (Semantic Versions). */
export type Semver = SemverValue;

/**
 * A type representing a semantic version range. The ranges consist of a nested array, which
 * represents a set of OR comparisons while the inner array represents AND comparisons.
 */
export type SemverRange = Std.Range;

/**
 * Type contracts for working with Semver ("Semantic Versions").
 */
export namespace Semver {
  /**
   * Tools for working with Semver ("Semantic Versions").
   */
  export type Lib = {
    /** Semver value assertions. */
    readonly Is: Is.Lib;

    /** Information about SemVerRelease */
    readonly Release: Release.Lib;

    /** Helpers for extracting the modifier prefix of a semver (eg "^" or ">=" etc). */
    readonly Prefix: Prefix.Lib;

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
    sort(input: t.StringSemver[], options?: t.SemverSortOptionsInput): t.StringSemver[];
    sort(input: t.Semver[], options?: t.SemverSortOptionsInput): t.Semver[];

    /** Format SemVer object into a string.  */
    toString(input: t.Semver | t.StringSemver): t.StringSemver;

    /**
     * Return the greatest (latest) semver from the given list.
     * - Invalid or undefined values are ignored.
     * - If all values are missing/invalid → returns undefined.
     */
    latest(...inputs: t.Ary<t.Semver | t.StringSemver | undefined>): t.StringSemver | undefined;
  };

  /**
   * Semver value assertion contracts.
   */
  export namespace Is {
    /**
     * Library: Semver value assertions.
     */
    export type Lib = {
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
  }

  /**
   * Semver release contracts.
   */
  export namespace Release {
    /**
     * Information about SemVerRelease
     */
    export type Lib = {
      /** List of release types. */
      types: t.SemverReleaseType[];
    };
  }

  /**
   * Semver prefix helper contracts.
   */
  export namespace Prefix {
    /**
     * Helpers for extracting the modifier prefix of a semver (eg "^" or ">=" etc).
     */
    export type Lib = {
      /** Removes any modifier prefixes from the semver. */
      strip(input: string): t.StringSemver;

      /** Removes any modifier prefixes from the semver. */
      get(input: string): string;
    };
  }

  /**
   * Server-side Semver contracts.
   */
  export namespace Server {
    /**
     * Tools for working with Semver ("Semantic Versions").
     */
    export type Lib = Semver.Lib & {
      /** Console formatting helpers. */
      readonly Fmt: Fmt;
    };

    /** Console formatting helpers. */
    export type Fmt = {
      colorize(version: t.StringSemver | t.Semver, options?: ColorizeOptions): string;
    };

    /** Options passed to `Semver.Server.Fmt.colorize`. */
    export type ColorizeOptions = {
      highlight?: t.SemverReleaseType;
      baseColor?: t.WrapAnsiColor;
      prefixColor?: t.WrapAnsiColor;
      prereleaseColor?: t.WrapAnsiColor;
    };
  }
}

/** Options for the `Semver.sort` method. */
export type SemverSortOptions = { order?: t.SortOrder };
/** Input type accepted by Semver.sort, either options or a sort order. */
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
