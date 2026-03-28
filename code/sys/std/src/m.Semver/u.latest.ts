import { compare, format } from '@std/semver';

import { type t } from './common.ts';
import { Is } from './m.Is.ts';
import { parse } from './u.parse.ts';

type Input = t.Semver | t.StringSemver | undefined;

/**
 * Return the greatest (latest) semver from the given list.
 * - Invalid or undefined values are ignored.
 * - If all values are missing/invalid → returns undefined.
 */
export const latest: t.SemverLib['latest'] = (
  ...inputs: t.Ary<Input>
): t.StringSemver | undefined => {
  /**
   * 1. Filter to valid inputs (string or SemVer object).
   */
  const valid: (t.Semver | t.StringSemver)[] = [];

  for (const value of inputs) {
    if (!value) continue;
    if (!Is.valid(value)) continue;
    valid.push(value);
  }

  if (valid.length === 0) return undefined;

  /**
   * Helper: normalize to a SemVer object.
   * - Strings go through our `parse` helper (prefix stripping, error handling).
   * - SemVer objects are used as-is.
   */
  const toSemver = (value: t.Semver | t.StringSemver): t.Semver => {
    return typeof value === 'string' ? parse(value).version : value;
  };

  /**
   * 2. Reduce to the maximum candidate by SemVer comparison.
   */
  let bestValue = valid[0];
  let bestSemver = toSemver(bestValue);

  for (let i = 1; i < valid.length; i += 1) {
    const candidateValue = valid[i];
    const candidateSemver = toSemver(candidateValue);
    if (compare(candidateSemver, bestSemver) > 0) {
      bestValue = candidateValue;
      bestSemver = candidateSemver;
    }
  }

  /**
   * 3. Return a canonical string representation.
   *    - If the original was a string, preserve it.
   *    - If it was a SemVer object, format it.
   */
  return typeof bestValue === 'string' ? bestValue : format(bestSemver);
};
