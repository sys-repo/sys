import { type t, isObject, UNKNOWN } from './common.ts';
import { Is } from './m.Pkg.Is.ts';

export const Pkg: t.PkgLib = {
  Is,
  toString(pkg) {
    if (!pkg || !isObject(pkg)) return Pkg.toString(UNKNOWN);
    const { name = UNKNOWN.name, version = UNKNOWN.version } = pkg;
    return `${name}@${version}`;
  },
};
