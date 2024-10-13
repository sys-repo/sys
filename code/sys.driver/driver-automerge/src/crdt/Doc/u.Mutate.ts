import { slug } from './common.ts';

export type O = Record<string, unknown>;

/**
 * Mutation helpers.
 */
export const Mutate = {
  /**
   * Adjusts the object, then cleans up.
   *    Useful for leaving a change in the CRDT history,
   *    without actually adjusting the object state.
   */
  emptyChange(d: any) {
    const key = `__tmp:${slug()}`;
    d[key] = 0;
    delete d[key]; // Clean up.
  },

  /**
   * Ensure a child object with the given key exists.
   */
  ensure<T extends O, K extends keyof T>(d: T, field: K, defaultValue: T[K]): NonNullable<T[K]> {
    if (d[field]) return d[field];
    d[field] = defaultValue;
    return d[field]!;
  },
} as const;
