import { type t, DEFAULTS, isObject } from './common.ts';

export const Is: t.PkgIs = {
  unknown(input) {
    const UNKNOWN = DEFAULTS.UNKNOWN;
    if (isObject(input)) {
      const { name, version } = input;
      if (typeof name !== 'string') return true;
      if (typeof version !== 'string') return true;
      return name === UNKNOWN.name && version === UNKNOWN.version;
    }
    if (typeof input !== 'string') return true;
    return input === `${UNKNOWN.name}@${UNKNOWN.version}`;
  },

  pkg(input: any): input is t.Pkg {
    if (!isObject(input)) return false;
    const pkg = input as t.Pkg;
    return typeof pkg.name === 'string' && typeof pkg.version === 'string';
  },

  dist(input: any): input is t.DistPkg {
    if (!isObject(input)) return false;
    const dist = input as t.DistPkg;
    if (!Is.pkg(dist.pkg)) return false;
    return (
      typeof dist.entry === 'string' &&
      typeof dist.hash.digest === 'string' &&
      isObject(dist.hash.parts)
    );
  },
};
