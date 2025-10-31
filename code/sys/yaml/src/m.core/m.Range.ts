import { type t } from './common.ts';
import { normalize, toLinePos } from './u.range.ts';

export const Range: t.YamlRangeLib = {
  toLinePos,
  normalize,
};
