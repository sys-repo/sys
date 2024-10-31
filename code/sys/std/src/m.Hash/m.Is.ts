import { type t, isObject } from './common.ts';

export const Is: t.HashIsLib = {
  composite(input?: any): input is t.CompositeHash {
    if (!isObject(input)) return false;
    const obj = input as t.CompositeHash;
    return typeof obj.digest === 'string' && isObject(obj.parts);
  },

  empty(input: t.HashInput) {
    if (typeof input === 'string') return input.length === 0;
    if (Is.composite(input)) {
      return input.digest.length === 0 && Object.keys(input.parts).length === 0;
    }
    return false;
  },
};
