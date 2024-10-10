import type { t } from '../common.ts';

export const ArrayLib: t.ArrayLib = {
  flatten<T>(list: any): T[] {
    if (!Array.isArray(list)) return list;
    const result: any = list.reduce((a, b) => {
      const value: any = Array.isArray(b) ? ArrayLib.flatten(b) : b;
      return a.concat(value);
    }, []);
    return result as T[];
  },

  asArray<T>(input: T | T[]): T[] {
    return Array.isArray(input) ? input : [input];
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
};

/**
 * Helpers
 */
function startsWith<T>(subject: T[], compare: T[]): boolean {
  if (compare.length > subject.length) return false;
  for (let i = 0; i < compare.length; i++) {
    if (compare[i] !== subject[i]) return false;
  }
  return true;
}
