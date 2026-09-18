import { Num, type t } from '../common.ts';
import { fail } from './u.error.ts';

/** Resolve the strictest configured read-size cap. */
export const effectiveMaxReadBytes = (
  ...values: readonly (t.NumberBytes | undefined)[]
): t.NumberBytes | undefined => {
  let max: t.NumberBytes | undefined;
  for (const value of values) {
    if (value === undefined) continue;
    if (!Num.Is.safeInt(value) || value < 0) {
      throw fail('FilesMemoryError.InvalidPath', 'Invalid Files read byte limit');
    }
    max = max === undefined || value < max ? value : max;
  }
  return max;
};
