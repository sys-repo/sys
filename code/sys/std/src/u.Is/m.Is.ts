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
  promise<T = any>(input?: any): input is Promise<T> {
    return input !== null && input
      ? typeof input === 'object' && typeof input.then === 'function'
      : false;
  },

  /**
   * Determine if the value is a number.
   */
  numeric(input?: any) {
    if (typeof input === 'number') {
      return Number.isFinite(input); // Ensure not: NaN, Infinity, or -Infinity.
    }
    if (typeof input === 'bigint') {
      return true;
    }

    if (typeof input === 'string') {
      const trimmed = input.trim();
      if (trimmed === '') return false; // Empty string, not a number.
      const num = Number(trimmed);
      return !Number.isNaN(num) && Number.isFinite(num);
    }

    return false;
  },

  /**
   * Falsy check.
   * https://developer.mozilla.org/en-US/docs/Glossary/Falsy
   */
  falsy(input?: any): input is t.Falsy | typeof NaN {
    return (
      input === false ||
      input === 0 ||
      input === '' ||
      input === null ||
      input === undefined ||
      input === 0n ||
      Number.isNaN(input) // Handle NaN at runtime
    );
  },
};
