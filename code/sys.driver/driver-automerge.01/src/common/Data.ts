import type * as t from './t.ts';

type O = Record<string, unknown>;

export const Data = {
  /**
   * Convert type from normal JS array to include Automerge extensions.
   */
  array<T>(input: Array<T>): t.AutomergeArray<T> {
    if (!Array.isArray(input)) throw new Error('Not an array');

    const array = input as unknown as t.AutomergeArray<T>;
    if (typeof array.deleteAt !== 'function') throw new Error('Not an automerge array');

    return array;
  },

  /**
   * Safely assigns a value to the given object, or [delete] if value is <undefined>.
   * NOTE: Automerge does not allow <undefined>.
   */
  assign<T extends O, K extends keyof T>(obj: T, key: keyof T, value: T[K] | undefined) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      throw new Error('Not an object');
    }
    if (value === undefined) {
      delete obj[key];
    } else {
      (obj as any)[key] = value;
    }
  },

  /**
   * Safely ensures the given value exists on the object,
   * not replacing the value if it already exists.
   */
  ensure<T extends O, K extends keyof T>(obj: T, key: keyof T, initial: T[K]) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      throw new Error('Not an object');
    }
    if (obj[key] == undefined) Data.assign(obj, key, initial);
    return obj[key];
  },
} as const;
