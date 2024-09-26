/**
 * Helpers for deleting values and fields.
 */
export type DeleteLib = {
  /**
   * Deletes undefined keys from an object (clone).
   */
  undefined<T extends Record<string, unknown>>(obj: T): T;

  /**
   * Deletes empty keys from an object (clone).
   */
  empty<T extends Record<string, unknown>>(obj: T): T;
};
