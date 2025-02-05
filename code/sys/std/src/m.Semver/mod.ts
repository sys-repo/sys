/**
 * @module
 * Tools for working with semantic-versions.
 * https://semver.org
 */

import { compare, format, increment } from '@std/semver';

import { type t, Release } from './common.ts';
import { Is } from './m.Is.ts';
import { coerce } from './u.coerce.ts';
import { parse, range } from './u.parse.ts';
import { sort } from './u.sort.ts';
import { Prefix } from './m.Prefix.ts';

export const Semver: t.SemverLib = {
  /** Semver value assertions. */
  Is,

  /** Tools and information about SemVerRelease */
  Release,

  /** Helpers for extracting the modifier prefix of a semver (eg "^" or ">=" etc). */
  Prefix,

  /** Sort a list of versions. */
  sort,

  /** Attempt to parse a string as a semantic version, returning a SemVer object. */
  parse,

  /** Coerce a partial semver string into a complete semver. */
  coerce,

  /** Attempt to parse a SemVer range (eg ">=1.0.0 <2.0.0 || >=3.0.0"). */
  range,

  /** Returns the new SemVer resulting from an increment by release type. */
  increment,

  /** Compare two SemVers. */
  compare,

  /** Format a SemVer object into a string. */
  toString(input) {
    return typeof input === 'string' ? input : format(input);
  },
};
