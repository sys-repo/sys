import { R, isRecord } from '../common.ts';
import { walk } from './u.walk.ts';

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

/**
 * Converts an object into an array of {key,value} pairs.
 */
export function toArray<T = Record<string, unknown>, K = keyof T>(
  obj: Record<string, any>,
): { key: K; value: T[keyof T] }[] {
  return Object.keys(obj).map((key) => ({ key: key as unknown as K, value: obj[key] }));
}

/**
 * Walk the tree and ensure all strings are less than the given max-length.
 */
export function trimStringsDeep<T extends Record<string, any>>(
  obj: T,
  options: { maxLength?: number; ellipsis?: boolean; immutable?: boolean } = {},
) {
  // NB: This is a recursive function ← via Object.walk(🌳)
  const { ellipsis = true, immutable = true } = options;
  const MAX = options.maxLength ?? 35;

  const adjust = (obj: Record<string, string>) => {
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'string' && value.length > MAX) {
        let text = value.slice(0, MAX);
        if (ellipsis) text += '...';
        (obj as any)[key] = text;
      }
    });
  };

  const clone = immutable ? R.clone(obj) : obj;
  adjust(clone);
  walk(clone, (e) => {
    const value = e.value;
    if (typeof value === 'object' && value !== null) adjust(value);
  });

  return clone;
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

/**
 * Typed variant of the native [Object.keys].
 */
export function keys<T extends object>(obj: T): Array<keyof T> {
  return isRecord(obj) ? (Object.keys(obj) as Array<keyof T>) : [];
}
