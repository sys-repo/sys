import { isObject, type t } from './common.ts';

export const Is: t.Hash.Is.Lib = Object.freeze({
  composite(input): input is t.CompositeHash {
    if (!isObject(input)) return false;
    const obj = input as t.CompositeHash;
    return typeof obj.digest === 'string' && isObject(obj.parts);
  },

  compositeBuilder(input): input is t.CompositeHash.Builder {
    if (!isObject(input)) return false;
    if (!Is.composite(input)) return false;
    const builder = input as t.CompositeHash.Builder;
    return (
      typeof builder.length === 'number' &&
      typeof builder.add === 'function' &&
      typeof builder.remove === 'function' &&
      typeof builder.toObject === 'function' &&
      typeof builder.toString === 'function'
    );
  },

  empty(input: t.HashInput) {
    if (typeof input === 'string') return input.length === 0;
    if (Is.composite(input)) {
      return input.digest.length === 0 && Object.keys(input.parts).length === 0;
    }
    return false;
  },
});
