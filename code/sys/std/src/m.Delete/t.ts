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

  /**
   * Delete the given fields and return a new object type with those keys removed.
   * Usage: Delete.fields(obj, 'a', 'b') -> Omit<typeof obj, 'a' | 'b'>
   */
  fields: <T extends Record<string, unknown>, const K extends readonly (keyof T)[]>(
    obj: T,
    ...keys: K
  ) => Omit<T, K[number]>;
};
