import type { t } from '../common.ts';
import { Err } from '../m.Err/mod.ts';
import { Is as RxIs } from '../m.Rx/mod.ts';

const { observable, subject } = RxIs;
const { errorLike, stdError } = Err.Is;

/**
 * Common flag evaluators.
 */
export const Is: t.StdIsLib = {
  observable,
  subject,
  errorLike,
  stdError,

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

  nil(input?: any) {
    return input === undefined || input === null;
  },

  promise<T = any>(input?: any): input is Promise<T> {
    return input !== null && input
      ? typeof input === 'object' && typeof input.then === 'function'
      : false;
  },

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

  json(input?: any): input is t.Json {
    if (typeof input !== 'string') return false;
    input = input.trim();
    return input.startsWith('{') || input.startsWith('[');
  },

  arrayBufferLike(input?: any): input is ArrayBufferLike {
    return input instanceof ArrayBuffer || input instanceof SharedArrayBuffer;
  },

  /**
   * A safe way to test any value as to wheather is is 'blank'
   * meaning it can be either:
   *   - null
   *   - undefined
   *   - empty-string ('')
   *   - empty-array ([]).
   */
  blank(value?: any) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.filter((v) => !Is.blank(v)).length === 0) return true;
    return false;
  },
};
