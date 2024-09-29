import type { t } from '../common.ts';

/**
 * Helpers for working with errors.
 */
export const Err: t.ErrorLib = {
  /**
   * Determine if the given value is "like" an error in that it
   * exposes a {message} property.
   */
  isErrorLike(input: any): input is t.ErrorLike {
    if (input === null || typeof input !== 'object') return false;
    if (input instanceof Error) return true;
    return typeof input.message === 'string';
  },
};
