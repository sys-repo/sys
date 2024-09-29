import type { t } from '../common.ts';
import { Err } from '../u.Err/mod.ts';
import { Is as RxIs } from '../u.Observable/mod.ts';

const { observable, subject } = RxIs;
const errorLike = Err.isErrorLike;

/**
 * Common flag evaluators.
 */
export const Is: t.CommonIsLib = {
  observable,
  subject,
  errorLike,

  /**
   * Determines whether the given value is a Promise.
   */
  promise<T = any>(value?: any): value is Promise<T> {
    return value !== null && value
      ? typeof value === 'object' && typeof value.then === 'function'
      : false;
  },
};
