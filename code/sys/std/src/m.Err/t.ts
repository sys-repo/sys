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
  stdError(input: unknown, options?: t.ErrStdErrorOptions): StdError;
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

/**
 * An object that looks like a simple Error object
 * in that it contains a "message" string.
 */
export type ErrorLike = { message: string };

/**
 * A simple serializable object that conforms to the shape of
 * a standard javascript [Error] object.
 */
export type StdError = ErrorLike & { name: string; cause?: StdError };
