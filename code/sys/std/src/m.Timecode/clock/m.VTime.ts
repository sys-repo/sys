import { type t } from '../common.ts';

export const VTime: t.VTimeLib = {
  fromMsecs: (ms) => ms as t.VTime,
  toMsecs: (v) => v as t.Msecs,
  zero: 0 as t.VTime,
};
