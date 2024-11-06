import type { t } from '../common.ts';

type O = Record<string, unknown>;
type PathArray = (string | number)[];
type KeyMap = { [key: string]: any };

/**
 * Tools for working with objects.
 */
export type ObjLib = {
  /**
   * Walks an object tree (recursive descent) implementing
   * a visitor callback for each item.
   */
  walk<T extends object | any[]>(parent: T, fn: t.ObjWalkCallback): void;

  /**
   * Converts an object into an array of {key,value} pairs.
   */
  toArray<T = O, K = keyof T>(obj: Record<string, any>): { key: K; value: T[keyof T] }[];

  /**
   * Walk the tree and ensure all strings are less than the given max-length.
   */
  trimStringsDeep<T extends Record<string, any>>(
    obj: T,
    options?: { maxLength?: number; ellipsis?: boolean; immutable?: boolean },
  ): T;

  /**
   * Retrieve a new object containing only the given set of keys.
   */
  pick<T extends O>(subject: T, ...fields: (keyof T)[]): T;

  /**
   * Builds an object from the given path
   * (shallow or a period seperated deep path).
   */
  build<T>(
    keyPath: string,
    root: { [key: string]: any },
    value?: any, // Optional.  Value to set, defaults to {}.
  ): T;

  /**
   * Walks the given (period seperated) key-path to retrieve a value.
   */
  pluck<T>(keyPath: string, root: { [key: string]: any }): T;

  /**
   * Remove values from the given object.
   */
  remove(
    keyPath: string,
    root: { [key: string]: any },
    options?: { type?: 'LEAF' | 'PRUNE' },
  ): KeyMap;

  /**
   * Prunes values on the given period seperated key-path from an object.
   */
  prune(keyPath: string, root: { [key: string]: any }): KeyMap;
};

/** A callback passed to the object walker function. */
export type ObjWalkCallback = (e: ObjWalkCallbackArgs) => void;

/** Arguments for a walker callback. */
export type ObjWalkCallbackArgs = {
  readonly parent: object | any[];
  readonly path: PathArray;
  readonly key: string | number;
  readonly value: any;
  stop(): void;
  mutate<T>(value: T): void;
};
