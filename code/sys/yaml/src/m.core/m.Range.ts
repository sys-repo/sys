import { type t } from './common.ts';
import { normalize, toLinePos } from './u/u.range.ts';

export const Range: t.YamlRangeLib = Object.freeze({
  toLinePos,
  normalize,
});
