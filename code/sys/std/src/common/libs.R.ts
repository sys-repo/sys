import type { RLib } from './t.ts';
import { deep as equals } from '../m.Eql/m.Eql.ts';

/**
 * Small functional utility subset kept behind the legacy `R` facade.
 *
 * NB: Do not import the Ramda barrel here. Local Deno/npm materialization of
 * Ramda can break the whole monorepo startup path even when the broken helper
 * is not used. Keep this facade dependency-free and retire consumers gradually.
 */
export const R: RLib = {
  clone,
  clamp,
  equals,
  mergeDeepRight,
  flatten,
  is,
  prop,
  sort,
  sortBy,
  toString,
  uniq,
  uniqBy,
};

function clone<T>(value: T): T {
  return cloneValue(value, new WeakMap()) as T;
}

function cloneValue(value: unknown, seen: WeakMap<object, unknown>): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);

  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);
  if (ArrayBuffer.isView(value)) return cloneArrayBufferView(value);
  if (value instanceof ArrayBuffer) return value.slice(0);

  if (Array.isArray(value)) {
    const res: unknown[] = [];
    seen.set(value, res);
    value.forEach((item, index) => res[index] = cloneValue(item, seen));
    return res;
  }

  if (value instanceof Map) {
    const res = new Map<unknown, unknown>();
    seen.set(value, res);
    value.forEach((mapValue, key) => res.set(cloneValue(key, seen), cloneValue(mapValue, seen)));
    return res;
  }

  if (value instanceof Set) {
    const res = new Set<unknown>();
    seen.set(value, res);
    value.forEach((item) => res.add(cloneValue(item, seen)));
    return res;
  }

  const res = Object.create(Object.getPrototypeOf(value));
  seen.set(value, res);
  for (const key of Reflect.ownKeys(value)) {
    res[key] = cloneValue((value as Record<PropertyKey, unknown>)[key], seen);
  }
  return res;
}

function cloneArrayBufferView(value: ArrayBufferView): ArrayBufferView {
  if (value instanceof DataView) {
    return new DataView(value.buffer.slice(0), value.byteOffset, value.byteLength);
  }
  const ctor = value.constructor as { new (input: ArrayLike<number>): ArrayBufferView };
  return new ctor(value as unknown as ArrayLike<number>);
}

function clamp(min: number, max: number, value: number) {
  return Math.min(max, Math.max(min, value));
}

function mergeDeepRight<L extends object, RR extends object>(left: L, right: RR): L & RR {
  return mergeDeep(left, right) as L & RR;
}

function mergeDeep(left: unknown, right: unknown): unknown {
  if (!isPlainMergeRecord(left) || !isPlainMergeRecord(right)) return clone(right);

  const res: Record<PropertyKey, unknown> = clone(left) as Record<PropertyKey, unknown>;
  for (const key of Reflect.ownKeys(right)) {
    const leftValue = res[key];
    const rightValue = (right as Record<PropertyKey, unknown>)[key];
    res[key] = isPlainMergeRecord(leftValue) && isPlainMergeRecord(rightValue)
      ? mergeDeep(leftValue, rightValue)
      : clone(rightValue);
  }
  return res;
}

function isPlainMergeRecord(value: unknown): value is Record<PropertyKey, unknown> {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  if (value instanceof Date || value instanceof RegExp) return false;
  if (value instanceof Map || value instanceof Set) return false;
  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function flatten<T>(list: readonly unknown[]): T[] {
  return list.flat(Infinity) as T[];
}

function is(ctor: unknown, value: unknown): boolean {
  return typeof ctor === 'function' && value instanceof ctor;
}

function prop<K extends PropertyKey>(key: K): (obj: Record<K, unknown>) => unknown;
function prop<K extends PropertyKey, T extends Record<K, unknown>>(key: K, obj: T): T[K];
function prop(key: PropertyKey, obj?: Record<PropertyKey, unknown>) {
  const getter = (input: Record<PropertyKey, unknown>) => input?.[key];
  return arguments.length === 1 ? getter : getter(obj ?? {});
}

function sort<T>(compare: (a: T, b: T) => number, items: readonly T[]) {
  return [...items].sort(compare);
}

function sortBy<T>(fn: (item: T) => unknown): (items: readonly T[]) => T[];
function sortBy<T>(fn: (item: T) => unknown, items: readonly T[]): T[];
function sortBy<T>(fn: (item: T) => unknown, items?: readonly T[]) {
  const run = (input: readonly T[]) => [...input].sort((a, b) => compareAsc(fn(a), fn(b)));
  return arguments.length === 1 ? run : run(items ?? []);
}

function compareAsc(a: unknown, b: unknown) {
  if (a === b) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  return a < b ? -1 : 1;
}

function toString(value: unknown) {
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  try {
    const json = JSON.stringify(value);
    if (json !== undefined) return json;
  } catch {
    // Fall through to platform stringification.
  }
  return String(value);
}

function uniq<T>(items: readonly T[]) {
  const res: T[] = [];
  for (const item of items) {
    if (!res.some((existing) => equals(existing, item))) res.push(item);
  }
  return res;
}

function uniqBy<T>(fn: (item: T) => unknown, items: readonly T[]) {
  const res: T[] = [];
  const seen: unknown[] = [];
  for (const item of items) {
    const key = fn(item);
    if (seen.some((existing) => equals(existing, key))) continue;
    seen.push(key);
    res.push(item);
  }
  return res;
}
