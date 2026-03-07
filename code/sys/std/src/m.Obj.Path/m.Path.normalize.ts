import { type t } from './common.ts';
import { decode } from './m.Codec.u.ts';

export const normalize: t.ObjPathLib['normalize'] = (input, opts) => {
  if (Array.isArray(input)) return input as t.ObjectPath;
  if (typeof input === 'string') {
    const codec = opts?.codec ?? 'pointer';
    const numeric = !!opts?.numeric;
    return decode(input, { codec, numeric });
  }
  return [];
};
