import { type t } from '../common.ts';
import { isBoundLex, splitOnce } from './u.ts';

export const is: t.TimecodeSliceLib['is'] = (input): input is t.TimecodeSliceString => {
  if (typeof input !== 'string') return false;
  const idx = input.indexOf('..');
  if (idx < 0) return false;
  if (input.indexOf('..', idx + 2) !== -1) return false; // must appear exactly once

  const [a, b] = splitOnce(input, '..');
  return isBoundLex(a) && isBoundLex(b);
};
