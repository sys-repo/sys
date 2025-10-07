import type { t } from '../common.ts';
import type { ArrayLib } from './t.ts';

import { asArray } from './u.asArray.ts';
import { equal } from './u.equality.ts';
import { sortBy } from './u.sortBy.ts';
import { startsWith } from './u.startsWith.ts';

export const Arr: ArrayLib = {
  asArray,
  sortBy,
  startsWith,
  equal,

  isArray(input: unknown) {
    return Array.isArray(input);
  },

  /**
   * Converts a nested set of arrays into a flat single-level array.
   */
  flatten<T>(list: unknown): T[] {
    if (!Array.isArray(list)) return [list as T];
    return (list as unknown[]).flat(Infinity) as T[];
  },

  async asyncFilter<T>(list: T[], predicate: (value: T) => Promise<boolean>) {
    const results = await Promise.all(list.map(predicate));
    return list.filter((_, index) => results[index]);
  },

  page<T>(list: T[] = [], index: t.Index, limit: number): T[] {
    index = Math.max(0, index);
    limit = Math.max(0, limit);
    const startIndex = index * limit;
    const endIndex = startIndex + limit;
    return list.slice(startIndex, endIndex);
  },

  compare<T>(subject: T[]) {
    return {
      subject,
      startsWith: (compare: T[]) => startsWith(subject, compare),
    };
  },

  uniq<T>(list: readonly T[]): T[] {
    return [...new Set(list)];
  },
};
