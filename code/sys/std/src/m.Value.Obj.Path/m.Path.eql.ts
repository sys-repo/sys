import { type t } from './common.ts';

export const eql: t.ObjPathLib['eql'] = (a, b) => {
  // <undefined> never equals.
  if (!a || !b) return false;

  // Same reference (including same non-empty array).
  if (a === b) return true;

  // Quick length check.
  if (a.length !== b.length) return false;

  // Strict, ordered, element-by-element comparison:
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};
