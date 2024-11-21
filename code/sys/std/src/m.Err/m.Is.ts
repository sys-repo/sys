import { type t, isRecord } from './common.ts';

export const Is: t.ErrIs = {
  /**
   * Determine if the given value is "like" an error in that it
   * exposes a {message} property.
   */
  errorLike(input: any): input is t.ErrorLike {
    if (!isRecord(input)) return false;
    if (input instanceof Error) return true;
    return typeof input.message === 'string';
  },

  /**
   * Determine if the given value conforms to the [StdError] type.
   */
  stdError(input: any): input is t.StdError {
    if (!isRecord(input)) return false;
    if (input instanceof Error) return false; // NB: system error (not yet converted to simple/serlializable [StdError] object.
    if (typeof input.message === 'string' && typeof input.name === 'string') {
      if (input.cause !== undefined && !Is.stdError(input.cause)) return false;
      return true;
    }
    return false;
  },

  /**
   * Determine if the `StdError` is an aggregate of other errors, (aka. it has a [errors] array).
   */
  aggregate(input: any): input is t.StdError {
    if (!Is.stdError(input)) return false;
    if (!Array.isArray(input.errors)) return false;
    return input.errors.length > 0;
  },
};
