import type { t } from './common.ts';
import { deepEquals } from './u.kernel.ts';

/**
 * Structural equality helpers.
 */
export const Eql: t.Eql.Lib = Object.freeze({
  deep,
  unique,
  uniqueBy,
});

/**
 * Compare two values using the supported structural equality relation.
 */
export function deep(a: unknown, b: unknown): boolean {
  return deepEquals(a, b, { left: new WeakMap(), right: new WeakMap() });
}

/**
 * Return the first value from each structural-equality class.
 */
export function unique<T>(values: T[]): T[] {
  const res: T[] = [];
  for (const value of values) {
    if (!res.some((existing) => deep(existing, value))) res.push(value);
  }
  return res;
}

/**
 * Return the first item for each structurally unique key.
 */
export function uniqueBy<T>(fn: (value: T) => unknown, values: T[]): T[] {
  const res: T[] = [];
  const seen: unknown[] = [];
  for (const value of values) {
    const key = fn(value);
    if (seen.some((existing) => deep(existing, key))) continue;
    seen.push(key);
    res.push(value);
  }
  return res;
}
