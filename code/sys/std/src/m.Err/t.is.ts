import type { t } from './common.ts';

/**
 * Type guards.
 */
export type ErrIsLib = {
  /**
   * Determine if the given value is an Error instance.
   */
  error(input: unknown): input is Error;

  /**
   * Determine if the given value is "like" an error in that it
   * exposes a {message} property.
   */
  errorLike(input: unknown): input is t.ErrorLike;

  /**
   * Determine if the given value conforms to the `StdError` type.
   */
  stdError(input: unknown): input is t.StdError;

  /**
   * Determine if the `StdError` is an aggregate of other errors,
   * (aka. it has a [errors] array).
   */
  aggregate(input: unknown): input is t.StdError;
};
