import type { t } from '../common.ts';
import { isObject } from './u.ts';

export const Is: t.ErrIsLib = {
  /**
   * Determine if the given value is "like" an error in that it
   * exposes a {message} property.
   */
  errorLike(input: any): input is t.ErrorLike {
    if (!isObject(input)) return false;
    if (input instanceof Error) return true;
    return typeof input.message === 'string';
  },

  /**
   * Determine if the given value conforms to the [StdError] type.
   */
  stdError(input: any): input is t.StdError {
    if (!isObject(input)) return false;
    if (input instanceof Error) return false; // NB: system error (not yet converted to simple/serlializable [StdError] object.
    if (typeof input.message === 'string' && typeof input.name === 'string') {
      if (input.cause !== undefined && !Is.stdError(input.cause)) return false;
      return true;
    }
    return false;
  },
};
