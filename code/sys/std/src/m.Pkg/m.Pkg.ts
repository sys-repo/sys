import { type t, DEFAULTS, isObject } from './common.ts';
import { Dist } from './m.Dist.ts';
import { Is } from './m.Is.ts';

export const Pkg: t.PkgLib = {
  Is,
  Dist,

  toString(pkg) {
    const UNKNOWN = DEFAULTS.UNKNOWN;
    if (!pkg || !isObject(pkg)) return Pkg.toString(UNKNOWN);
    const { name = UNKNOWN.name, version = UNKNOWN.version } = pkg;
    return `${name}@${version}`;
  },

  fromJson(input, defName, defVersion) {
    const UNKNOWN = DEFAULTS.UNKNOWN;
    if (!isObject(input)) return UNKNOWN;

    const pkg = input as t.Pkg;
    const name = typeof pkg.name === 'string' ? pkg.name : defName ?? UNKNOWN.name;
    const version = typeof pkg.version === 'string' ? pkg.version : defVersion ?? UNKNOWN.version;

    return { name, version };
  },

  unknown() {
    return DEFAULTS.UNKNOWN;
  },
};
