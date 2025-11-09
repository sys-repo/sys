import { type t } from './common.ts';
import { between, find, findAtOrBefore, nearest, neighbors } from './u.ops.ts';

export const Ops: t.TimecodeOpsLib = {
  find,
  findAtOrBefore,
  neighbors,
  between,
  nearest,
};
