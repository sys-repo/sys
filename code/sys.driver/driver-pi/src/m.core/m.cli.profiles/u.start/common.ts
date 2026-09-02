export * from '../common.ts';
export { HashFmt } from '@sys/crypto/fmt';
export { Open } from '@sys/process';
export { BootstrapStatus } from '@sys/server/bootstrap/status';
export { Dist, DistServer } from '@sys/server/dist';
export { Is } from '@sys/std/is/server';

const apply = Reflect.apply;
const freeze = Object.freeze;
const NativeError = Error;
const NativeSet = Set;
const NativeUint8Array = Uint8Array;
const NativeWeakMap = WeakMap;
const NativeWeakSet = WeakSet;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const objectPrototype = Object.prototype;
const ownKeys = Reflect.ownKeys;
const arrayIncludes = Array.prototype.includes;
const arrayJoin = Array.prototype.join;
const arrayPush = Array.prototype.push;
const arraySome = Array.prototype.some;
const setAdd = NativeSet.prototype.add;
const setClear = NativeSet.prototype.clear;
const setDelete = NativeSet.prototype.delete;
const setForEach = NativeSet.prototype.forEach;
const stringCharCodeAt = String.prototype.charCodeAt;
const stringIncludes = String.prototype.includes;
const stringIndexOf = String.prototype.indexOf;
const stringRepeat = String.prototype.repeat;
const stringSlice = String.prototype.slice;
const stringTrimEnd = String.prototype.trimEnd;
const weakMapDelete = NativeWeakMap.prototype.delete;
const weakMapGet = NativeWeakMap.prototype.get;
const weakMapSet = NativeWeakMap.prototype.set;
const weakSetPrototype = NativeWeakSet.prototype;
const weakSetAdd = weakSetPrototype.add;
const weakSetHas = weakSetPrototype.has;
const weakSetHasDescriptor = snapshotDataDescriptor(weakSetPrototype, 'has');

/**
 * Captured host intrinsics for hostile-runtime hardening.
 *
 * Caller-controlled values and callbacks can mutate ambient constructors, reflection helpers, and
 * prototypes after startup begins. Every operation below dispatches through module-load references
 * so later ambient replacement cannot redirect validation, ownership, or cleanup authority.
 */
export const StartGuiIntrinsic = freeze({
  createError(message: string): Error {
    return new NativeError(message);
  },
  freeze<const T>(input: T): Readonly<T> {
    return apply(freeze, Object, [input]) as Readonly<T>;
  },
  hasObjectPrototype(input: object): boolean {
    return apply(getPrototypeOf, Object, [input]) === objectPrototype;
  },
  invoke<Args extends unknown[], Result>(
    operation: (...args: Args) => Result,
    args: Args,
  ): Result {
    return apply(operation, undefined, args) as Result;
  },
  ownKeys(input: object): (string | symbol)[] {
    return apply(ownKeys, Reflect, [input]) as (string | symbol)[];
  },
  ownPropertyDescriptor(input: object, key: PropertyKey): PropertyDescriptor | undefined {
    return apply(getOwnPropertyDescriptor, Object, [input, key]) as PropertyDescriptor | undefined;
  },
  arrayAppend<T>(target: T[], source: readonly T[]): void {
    for (let index = 0; index < source.length; index += 1) {
      apply(arrayPush, target, [source[index]]);
    }
  },
  arrayIncludes<T>(input: readonly T[], value: T): boolean {
    return apply(arrayIncludes, input, [value]) as boolean;
  },
  arrayJoin(input: readonly unknown[], separator: string): string {
    return apply(arrayJoin, input, [separator]) as string;
  },
  arrayMap<T, R>(input: readonly T[], mapper: (value: T, index: number) => R): R[] {
    const output: R[] = [];
    for (let index = 0; index < input.length; index += 1) {
      apply(arrayPush, output, [mapper(input[index], index)]);
    }
    return output;
  },
  arrayPush<T>(input: T[], value: T): number {
    return apply(arrayPush, input, [value]) as number;
  },
  arraySlice<T>(input: readonly T[], start = 0, end = input.length): T[] {
    const output: T[] = [];
    const limit = end < input.length ? end : input.length;
    for (let index = start; index < limit; index += 1) {
      apply(arrayPush, output, [input[index]]);
    }
    return output;
  },
  arraySome<T>(input: readonly T[], predicate: (value: T) => boolean): boolean {
    return apply(arraySome, input, [predicate]) as boolean;
  },
  createSet<T>(): Set<T> {
    return new NativeSet<T>();
  },
  createWeakMap<K extends object, V>(): WeakMap<K, V> {
    return new NativeWeakMap<K, V>();
  },
  createWeakSet<T extends object>(): WeakSet<T> {
    return new NativeWeakSet<T>();
  },
  setAdd<T>(input: Set<T>, value: T): void {
    apply(setAdd, input, [value]);
  },
  setClear<T>(input: Set<T>): void {
    apply(setClear, input, []);
  },
  setDelete<T>(input: Set<T>, value: T): void {
    apply(setDelete, input, [value]);
  },
  setSnapshot<T>(input: ReadonlySet<T>): readonly T[] {
    const output: T[] = [];
    apply(setForEach, input, [(value: T) => apply(arrayPush, output, [value])]);
    return freeze(output);
  },
  stringCharCodeAt(input: string, index: number): number {
    return apply(stringCharCodeAt, input, [index]) as number;
  },
  stringIncludes(input: string, value: string): boolean {
    return apply(stringIncludes, input, [value]) as boolean;
  },
  stringIndexOf(input: string, value: string): number {
    return apply(stringIndexOf, input, [value]) as number;
  },
  stringRepeat(input: string, count: number): string {
    return apply(stringRepeat, input, [count]) as string;
  },
  stringSlice(input: string, start: number, end?: number): string {
    return apply(stringSlice, input, [start, end]) as string;
  },
  stringTrimEnd(input: string): string {
    return apply(stringTrimEnd, input, []) as string;
  },
  uint8ArraySlice(input: Uint8Array): Uint8Array {
    const output = new NativeUint8Array(input.length);
    for (let index = 0; index < input.length; index += 1) output[index] = input[index];
    return output;
  },
  weakMapDelete<K extends object>(input: WeakMap<K, unknown>, key: K): void {
    apply(weakMapDelete, input, [key]);
  },
  weakMapGet<K extends object, V>(input: WeakMap<K, V>, key: K): V | undefined {
    return apply(weakMapGet, input, [key]) as V | undefined;
  },
  weakMapSet<K extends object, V>(input: WeakMap<K, V>, key: K, value: V): void {
    apply(weakMapSet, input, [key, value]);
  },
  weakSetAdd<T extends object>(input: WeakSet<T>, value: T): void {
    apply(weakSetAdd, input, [value]);
  },
  weakSetHas<T extends object>(input: WeakSet<T>, value: T): boolean {
    return apply(weakSetHas, input, [value]) as boolean;
  },
  weakSetPrototypeReady(): boolean {
    const actual = getOwnPropertyDescriptor(weakSetPrototype, 'has');
    return sameDataDescriptor(actual, weakSetHasDescriptor);
  },
});

function snapshotDataDescriptor(
  input: object,
  key: PropertyKey,
): Readonly<PropertyDescriptor> | undefined {
  const descriptor = getOwnPropertyDescriptor(input, key);
  if (!descriptor || !('value' in descriptor)) return;
  return freeze({
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    value: descriptor.value,
    writable: descriptor.writable,
  });
}

function sameDataDescriptor(
  actual: PropertyDescriptor | undefined,
  expected: Readonly<PropertyDescriptor> | undefined,
): boolean {
  return actual !== undefined && expected !== undefined && 'value' in actual &&
    actual.configurable === expected.configurable && actual.enumerable === expected.enumerable &&
    actual.value === expected.value && actual.writable === expected.writable;
}
