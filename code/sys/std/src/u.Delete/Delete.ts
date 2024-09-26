import type { t } from '../common.ts';

type O = Record<string, unknown>;

/**
 * Helpers for deleting values and fields.
 */
export const Delete: t.DeleteLib = {
  /**
   * Deletes undefined keys from an object (clone).
   */
  undefined<T extends O>(obj: T) {
    obj = { ...(obj as any) };
    Object.keys(obj)
      .filter((key) => obj[key] === undefined)
      .forEach((key) => delete obj[key]);
    return obj;
  },

  /**
   * Deletes empty keys from an object (clone).
   */
  empty<T extends O>(obj: T) {
    obj = { ...(obj as any) };
    Object.keys(obj)
      .filter((key) => obj[key] === undefined || obj[key] === '')
      .forEach((key) => delete obj[key]);
    return obj;
  },
};
