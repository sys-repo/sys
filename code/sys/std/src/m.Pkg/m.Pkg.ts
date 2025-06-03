import type { PkgLib } from './t.ts';

import { type t, DEFAULTS, isObject, isRecord } from './common.ts';
import { Dist } from './m.Dist.ts';
import { Is } from './m.Is.ts';

const UNKNOWN = DEFAULTS.UNKNOWN;

export const Pkg: PkgLib = {
  Is,
  Dist,

  toString(pkg, suffix) {
    if (!pkg || !isObject(pkg)) return Pkg.toString(UNKNOWN);
    const { name = UNKNOWN.name, version = UNKNOWN.version } = pkg;
    let res = `${name}@${version}`;
    if (typeof suffix === 'string') {
      suffix = suffix.trim().replace(/^\:+/, '').trimStart();
      if (suffix) res = `${res}:${suffix}`;
    }
    return res;
  },

  fromJson(input, defName, defVersion) {
    if (!isObject(input)) return { ...UNKNOWN };

    const pkg = input as t.Pkg;
    const name = typeof pkg.name === 'string' ? pkg.name : defName ?? UNKNOWN.name;
    const version = typeof pkg.version === 'string' ? pkg.version : defVersion ?? UNKNOWN.version;

    return { name, version };
  },

  unknown() {
    return { ...DEFAULTS.UNKNOWN };
  },

  toPkg(input) {
    /**
     * String form ­– "<name>@<version>".
     * Handles scoped names (e.g. "@scope/pkg@1.2.3").
     */
    if (typeof input === 'string') {
      const text = input.trim();
      const i = text.lastIndexOf('@');
      if (i > 0) {
        const name = text.slice(0, i);
        const version = text.slice(i + 1);
        if (name && version) return { name, version };
      }
      return Pkg.unknown();
    }

    /**
     * Object form ­– { name, version }.
     */
    if (!isRecord(input)) return Pkg.unknown();
    const { name, version } = input as Record<string, unknown>;
    return typeof name === 'string' && typeof version === 'string'
      ? { name, version }
      : Pkg.unknown();
  },
};
