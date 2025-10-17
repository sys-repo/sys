import { isRecord } from './common.ts';

type O = Record<string, unknown>;

/**
 * Typed variant of the native [Object.keys].
 */
export function keys<T extends object>(obj?: T): Array<keyof T> {
  return isRecord(obj) ? (Object.keys(obj) as Array<keyof T>) : [];
}

/**
 * Retrieve a typed JS-entries collection for the given object.
 */
export function entries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  type Entries = [keyof T, T[keyof T]][];
  return Object.entries(obj) as Entries;
}

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

/**
 * Converts an object into an array of {key,value} pairs.
 */
export function toArray<T = Record<string, unknown>, K = keyof T>(
  obj: Record<string, any>,
): { key: K; value: T[keyof T] }[] {
  return Object.keys(obj).map((key) => ({ key: key as unknown as K, value: obj[key] }));
}

/**
 * Retrieve a new object containing only the given set of keys.
 */
export function pick<T extends O>(subject: T, ...fields: (keyof T)[]): T {
  return fields.reduce((acc, next) => {
    acc[next] = subject[next];
    return acc;
  }, {} as T);
}
