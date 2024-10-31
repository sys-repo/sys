import type { t } from '../common.ts';

/**
 * Boolean flag helpers for evaulating hash values.
 */
export type HashIsLib = {
  /**
   * Determine if the given object represents a [CompositeHash].
   */
  composite(input: unknown): input is t.CompositeHash;

  /**
   * Determine if the hash input is empty.
   */
  empty(input: t.HashInput): boolean;
};
