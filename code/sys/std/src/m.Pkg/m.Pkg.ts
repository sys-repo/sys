import { type t, DEFAULTS, isObject } from './common.ts';
import { Is } from './m.Pkg.Is.ts';

export const Pkg: t.PkgLib = {
  Is,

  toString(pkg) {
    const UNKNOWN = DEFAULTS.UNKNOWN;
    if (!pkg || !isObject(pkg)) return Pkg.toString(UNKNOWN);
    const { name = UNKNOWN.name, version = UNKNOWN.version } = pkg;
    return `${name}@${version}`;
  },

  fromJson(input) {
    const UNKNOWN = DEFAULTS.UNKNOWN;
    if (!isObject(input)) return UNKNOWN;

    const pkg = input as t.Pkg;
    const name = typeof pkg.name === 'string' ? pkg.name : UNKNOWN.name;
    const version = typeof pkg.version === 'string' ? pkg.version : UNKNOWN.version;
    return { name, version };
  },

  unknown() {
    return DEFAULTS.UNKNOWN;
  },
};
