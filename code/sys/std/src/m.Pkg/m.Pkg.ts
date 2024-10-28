import { type t, isObject } from './common.ts';

export const Pkg: t.PkgLib = {
  toString(pkg) {
    if (!pkg || !isObject(pkg)) return '';
    return `${pkg.name}@${pkg.version}`;
  },
};
