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

  /**
   * Deletes specific fields from an object (clone).
   */
  fields<T extends O, const K extends readonly (keyof T)[]>(
    obj: T,
    ...keys: K
  ): Omit<T, K[number]> {
    const clone: Record<PropertyKey, unknown> = { ...(obj as any) };
    for (const key of keys) delete clone[key as PropertyKey];
    return clone as Omit<T, K[number]>;
  },

  /**
   * Removes any function-valued fields from an object (shallow clone).
   */
  funcs<T extends O>(obj: T): T {
    const clone: Record<string, unknown> = { ...(obj as any) };
    for (const key of Object.keys(clone)) {
      if (typeof clone[key] === 'function') delete clone[key];
    }
    return clone as T;
  },
};
