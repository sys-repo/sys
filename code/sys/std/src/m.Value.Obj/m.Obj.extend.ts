import { type t } from '../common.ts';
import { clone as deepClone } from './m.Obj.clone.ts';

/**
 * Deeply clones and extends the given object with a set of extra properties.
 */
export const extend: t.ObjLib['extend'] = <T extends object, U extends object>(
  src: T,
  extra: U,
): t.ObjExtend<T, U> => {
  const clone = deepClone(src);
  const descriptors = Object.getOwnPropertyDescriptors(extra);
  Object.defineProperties(clone, descriptors);
  return clone as t.ObjExtend<T, U>;
};
