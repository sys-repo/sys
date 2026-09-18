type O = Record<string, unknown>;

/**
 * Sort the keys of an object.
 */
export function sortKeys<T extends O>(obj: T): T {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key: keyof T) => {
      acc[key] = obj[key];
      return acc;
    }, {} as T);
}
