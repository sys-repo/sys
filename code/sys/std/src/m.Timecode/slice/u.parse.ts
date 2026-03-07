import { type t } from '../common.ts';
import { is } from './u.is.ts';
import { splitOnce, toBound } from './u.ts';

export const parse: t.TimecodeSliceLib['parse'] = (input) => {
  // Precondition: call-sites should guard with is(), but we still handle defensively.
  if (!is(input)) throw new Error('Invalid time slice string');
  const [a, b] = splitOnce(input, '..');
  const start = toBound(a);
  const end = toBound(b);
  return { raw: input, start, end };
};
