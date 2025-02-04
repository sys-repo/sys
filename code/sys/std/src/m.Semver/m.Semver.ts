import { compare, format, increment } from '@std/semver';

import { type t, Release } from './common.ts';
import { Is } from './m.Is.ts';
import { coerce } from './u.coerce.ts';
import { parse } from './u.parse.ts';
import { sort } from './u.sort.ts';
import { stripPrefix } from './u.prefix.ts';

export const Semver: t.SemverLib = {
  /** Semver value assertions. */
  Is,

  /** Tools and information about SemVerRelease */
  Release,

  /** Sort a list of versions. */
  sort,

  /** Attempt to parse a string as a semantic version, returning a SemVer object. */
  parse,

  /** Coerce a partial semver string into a complete semver. */
  coerce,

  /** Returns the new SemVer resulting from an increment by release type. */
  increment,

  /** Compare two SemVers. */
  compare,

  /** Removes any modifier prefixes from the semver (eg. "~" or "^" or ">="). */
  stripPrefix,

  /** Format a SemVer object into a string. */
  toString(input) {
    return typeof input === 'string' ? input : format(input);
  },
};
