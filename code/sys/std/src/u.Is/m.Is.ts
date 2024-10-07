import type { t } from '../common.ts';
import { Err } from '../u.Err/mod.ts';
import { Is as RxIs } from '../u.Observable/mod.ts';

const { observable, subject } = RxIs;
const { errorLike, stdError } = Err.Is;

/**
 * Common flag evaluators.
 */
export const Is: t.CommonIsLib = {
  observable,
  subject,
  errorLike,
  stdError,

  /**
   * Determine if the value is a Promise.
   */
  promise<T = any>(value?: any): value is Promise<T> {
    return value !== null && value
      ? typeof value === 'object' && typeof value.then === 'function'
      : false;
  },

  /**
   * Determine if the value is a number.
   */
  numeric(value?: any) {
    if (typeof value === 'number') {
      return Number.isFinite(value); // Ensure not: NaN, Infinity, or -Infinity.
    }
    if (typeof value === 'bigint') {
      return true;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return false; // Empty string, not a number.
      const num = Number(trimmed);
      return !Number.isNaN(num) && Number.isFinite(num);
    }

    return false;
  },
};
