import { type t } from '../common.ts';
import { make, makeForTotal } from './u.vclock.make.ts';

export const VClock: t.VirtualClock.Lib = {
  make,
  makeForTotal,
};
