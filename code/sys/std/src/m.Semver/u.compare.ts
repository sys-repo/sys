import {
  equals,
  greaterThan as gt,
  greaterOrEqual as gte,
  greaterThanRange as gtr,
  lessThan as lt,
  lessOrEqual as lte,
  lessThanRange as ltr,
} from '@std/semver';

import { type t } from './common.ts';
import { coerce } from './u.coerce.ts';
import { parse, range as parseRange } from './u.parse.ts';

type L = t.SemverIsLib;
type InputV = string | t.Semver;
type InputR = string | t.SemverRange;

type Semvers = SemversOK | SemversFail;
type SemversOK = { ok: true; a: t.Semver; b: t.Semver };
type SemversFail = { ok: false };

type SemverRange = SemverRangeOK | SemverRangeFail;
type SemverRangeOK = { ok: true; version: t.Semver; range: t.SemverRange };
type SemverRangeFail = { ok: false };

export const eql: L['eql'] = (a, b) => {
  const ver = wrangle.semvers(a, b);
  return ver.ok ? equals(ver.a, ver.b) : false;
};

/**
 * > | Greater-than.
 */

export const greaterThan: L['greaterThan'] = (a, b) => {
  const ver = wrangle.semvers(a, b);
  return ver.ok ? gt(ver.a, ver.b) : false;
};

export const greaterOrEqual: L['greaterOrEqual'] = (a, b) => {
  const ver = wrangle.semvers(a, b);
  return ver.ok ? gte(ver.a, ver.b) : false;
};

export const greaterThanRange: L['greaterThanRange'] = (version, range) => {
  const p = wrangle.versionRange(version, range);
  return p.ok ? gtr(p.version, p.range) : false;
};

/**
 * < | Less-than.
 */
export const lessThan: L['lessThan'] = (a, b) => {
  const ver = wrangle.semvers(a, b);
  return ver.ok ? lt(ver.a, ver.b) : false;
};

export const lessOrEqual: L['lessOrEqual'] = (a, b) => {
  const ver = wrangle.semvers(a, b);
  return ver.ok ? lte(ver.a, ver.b) : false;
};

export const lessThanRange: L['lessThanRange'] = (version, range) => {
  const p = wrangle.versionRange(version, range);
  return p.ok ? ltr(p.version, p.range) : false;
};

/**
 * Helpers
 */
const wrangle = {
  semver(input: InputV): t.Semver | undefined {
    if (typeof input === 'object') return input;
    const version = coerce(input).version;
    const parsed = version ? parse(version) : undefined;
    return parsed && !parsed.error ? parsed.version : undefined;
  },

  semvers(input1: InputV, input2: InputV): Semvers {
    const a = wrangle.semver(input1)!;
    const b = wrangle.semver(input2)!;
    const ok = !!a && !!b;
    return ok ? { ok, a, b } : { ok };
  },

  versionRange(inputVersion: InputV, inputRange: InputR): SemverRange {
    const version = wrangle.semver(inputVersion)!;
    const range = typeof inputRange === 'string' ? parseRange(inputRange).range : inputRange;
    const ok = !!version;
    return ok ? { ok, version, range } : { ok: false };
  },
} as const;
