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
};
