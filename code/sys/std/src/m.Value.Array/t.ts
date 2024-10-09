import type { t } from '../common.ts';

/**
 * Tools for working with Arrays.
 */
export type ArrayLib = {
  /* Converts a nested set of arrays into a flat single-level array. */
  flatten<T>(list: unknown): T[];

  /* Ensures a value is an array. */
  asArray<T>(input: T | T[]): T[];

  /* Filter an array with an asynchronous predicate. */
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
};
