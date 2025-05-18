import toHash from 'hash-it';
import { type t } from '../common.ts';

/**
 * Convert the value to a simple number-hash.
 * "fast, consistent, unique hashCode" on any JS value object.
 */
export const hash: t.ObjLib['hash'] = <T>(value: T): number => {
  return toHash<T>(value);
};
