import type { t } from '../common.ts';

/**
 * Tools for evaluating and manipulating arrays.
 */
export type ArrayLib = {
  /**
   * Ensure a value is an array.
   */
  asArray: <T>(input: T | T[]) => T[];

  /**
   * Converts a nested set of arrays into a flat single-level array.
   */
  flatten<T>(list: unknown): T[];

  /**
   * Filter an array with an asynchronous predicate.
   */
  asyncFilter<T>(list: T[], predicate: (value: T) => Promise<boolean>): Promise<T[]>;

  /**
   * Extract a "page" sub-set from the given array of items.
   * @param list The array of items to paginate.
   * @param index The page number (1-based index).
   * @param limit The number of items per page.
   * @returns An array containing the items for the specified page.
   */
  page<T>(list: T[] | undefined, index: t.Index, limit: number): T[];

  /**
   * Helper for perfoming array comparisons.
   * @param subject - The array whose elements are being examined.
   */
  compare<T>(subject: T[]): { subject: T[]; startsWith: (compare: T[]) => boolean };

  /**
   * Returns a new array with duplicates removed.
   */
  uniq<T>(values: readonly T[]): T[];

  /**
   * Return a NEW array sorted by the given key.
   *
   * @param items – source array (readonly is fine).
   * @param key   – property to sort on.
   * @param dir   – 'asc' | 'desc'  (default: 'asc').
   *
   * • `undefined` values are pushed to the end for 'asc'
   *   (and to the front for 'desc').
   * • Numbers use arithmetic compare; everything else falls
   *   back to String-compare (`localeCompare`).
   */
  sortBy<T, K extends keyof T>(items: readonly T[], key: K, dir?: 'asc' | 'desc'): T[];
};
