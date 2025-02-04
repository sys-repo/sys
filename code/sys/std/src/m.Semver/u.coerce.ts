import { type t, Err } from './common.ts';

/**
 * Coerces a partial semver string into a complete semver.
 *
 * Explanation:
 *    Splits the version into the numeric “core” and the rest (e.g. pre-release or build metadata).
 *    If the core version has only a major part, it appends ".0.0".
 *    If it has major and minor parts, it appends ".0".
 *    Otherwise, it returns the version (core + extra) unchanged.
 *
 * Examples:
 *   "^7"              →   "^7.0.0"
 *   "~6.5"            →   "~6.5.0"
 *   ">=3.4.2"         →   ">=3.4.2"
 *   "<1-alpha"        →   "<1.0.0-alpha"
 *   "2.3-beta.1"      →   "2.3.0-beta.1"
 *   "4.5.6+build.1"   →   "4.5.6+build.1"
 */
export const coerce: t.SemverLib['coerce'] = (version) => {
  const errors = Err.errors();

  type T = t.SemverCoerceResponse;
  const done = (version: string): T => ({ version, error: errors.toError() });
  const fail = (error: string) => {
    errors.push(error);
    return done('');
  };

  if (typeof version !== 'string') {
    return fail(`Specified version is invalid type (${typeof version})`);
  }

  const trimmed = version.trim();
  if (!trimmed) return fail('Specified version is empty');

  /**
   * The regex captures:
   *   1. An optional operator prefix (without trailing whitespace):
   *      one of ~, ^, <=, >=, <, or >
   *   2. Optional whitespace between the operator and the numeric core.
   *   3. The numeric core: one to three groups of digits separated by periods.
   *   4. The rest of the string: pre-release and/or build metadata.
   *
   * Breakdown:
   *   ^((?:[~^]|<=|>=|<|>))?   => Optional operator prefix.
   *   \s*                      => Optional whitespace.
   *   (\d+(?:\.\d+){0,2})      => Numeric core (1 to 3 parts).
   *   (.*)$                   => The rest of the string.
   */
  const regex = /^((?:[~^]|<=|>=|<|>))?\s*(\d+(?:\.\d+){0,2})(.*)$/;
  const match = trimmed.match(regex);

  if (!match) {
    return fail(`Specified version is invalid type ("${version}")`);
  }

  const operator = match[1] || '';
  const core = match[2];
  let extra = match[3] || '';

  // Validate the extra portion if it exists.
  if (extra && extra.length > 0) {
    // Extra must begin with either '-' or '+'
    if (extra[0] !== '-' && extra[0] !== '+') {
      return fail(`Invalid extra semver characters: "${extra}" in version "${version}"`);
    }
  }

  // Append missing parts to get exactly 3 numeric segments.
  const parts = core.split('.');
  while (parts.length < 3) {
    parts.push('0');
  }

  const fullCore = parts.join('.');
  return done(operator + fullCore + extra);
};
