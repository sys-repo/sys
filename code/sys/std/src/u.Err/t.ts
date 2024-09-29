import type { t } from '../common.ts';

/**
 * Helpers for working with errors.
 */
export type ErrorLib = {
  /**
   * Determine if the given value is "like" an error in that it
   * exposes a {message} property.
   */
  isErrorLike(input: any): boolean;
};

