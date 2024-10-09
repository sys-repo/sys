import type { t } from '../common.ts';

/* Options passed to the `ErrLib.stdErr` method. */
export type ErrStdErrorOptions = { name?: string; cause?: unknown };

/**
 * Helpers for working with errors.
 */
export type ErrLib = {
  readonly Is: t.ErrIsLib;

  /**
   * Take unknown input and produce a standard error object.
   */
  stdError(input: unknown, options?: t.ErrStdErrorOptions): t.StdError;
};

/**
 * Type guards (boolean evaluators).
 */
export type ErrIsLib = {
  /**
   * Determine if the given value is "like" an error in that it
   * exposes a {message} property.
   */
  errorLike(input: unknown): input is t.ErrorLike;

  /**
   * Determine if the given value conforms to the [StdError] type.
   */
  stdError(input: unknown): input is t.StdError;
};
