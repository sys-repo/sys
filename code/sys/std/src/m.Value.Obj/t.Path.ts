import type { t } from './common.ts';

type KeyMap = { [key: string]: any };
type PathArray = (string | number)[];

/**
 * Tools for working with key paths.
 */
export type ObjPathLib = {
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
