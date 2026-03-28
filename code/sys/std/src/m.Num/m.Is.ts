import { Is as StdIs, type t } from './common.ts';

/**
 * Predicates over numeric values.
 */
export const Is: t.Num.IsLib = {
  finite(input?: unknown): input is number {
    return StdIs.number(input) && Number.isFinite(input);
  },

  int(input?: unknown): input is number {
    return Is.finite(input) && Number.isInteger(input);
  },

  safeInt(input?: unknown): input is number {
    return Is.int(input) && Number.isSafeInteger(input);
  },
};
