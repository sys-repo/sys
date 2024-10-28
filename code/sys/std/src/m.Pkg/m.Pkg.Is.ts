import { type t, UNKNOWN } from './common.ts';

export const Is: t.PkgIs = {
  unknown(input) {
    if (typeof input !== 'string') return true;
    return input === `${UNKNOWN.name}@${UNKNOWN.version}`;
  },
};
