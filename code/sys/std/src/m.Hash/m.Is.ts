import { type t, isObject } from './common.ts';

export const Is: t.HashIsLib = {
  composite(input?: any): input is t.CompositeHash {
    if (!isObject(input)) return false;
    const obj = input as t.CompositeHash;
    return typeof obj.digest === 'string' && isObject(obj.parts);
  },
};
