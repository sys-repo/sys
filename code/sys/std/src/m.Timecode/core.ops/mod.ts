import { type t } from '../common.ts';
import { between, find, findAtOrBefore, nearest, neighbors } from './u.ts';

export { between, find, findAtOrBefore, nearest, neighbors };

export const Ops: t.Timecode.Ops.Lib = Object.freeze({
  find,
  findAtOrBefore,
  neighbors,
  between,
  nearest,
});
