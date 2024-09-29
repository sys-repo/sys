import type { t } from '../common.ts';

/**
 * Helpers for working with errors.
 */
export type ErrorLib = {
  /**
   * Determine if the given value is "like" an error in that it
   * exposes a {message} property.
   */
  isErrorLike(input: any): input is t.ErrorLike;
};

/**
 * An object that looks like a simple Error object
 * in that it contains a "message" string.
 */
export type ErrorLike = { message: string };
