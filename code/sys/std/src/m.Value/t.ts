import type { t } from '../common.ts';

type O = Record<string, unknown>;

/**
 * Tools for evaluating and manipulating types of values.
 */
export type ValueLib = {
  /** Tools for working with arrays. */
  Array: t.ArrayLib;

  /** Tools for working with numbers. */
  Num: t.NumLib;

  /** Tools for working on strings of text. */
  Str: t.StrLib;

  /** Tools for working with objects. */
  Obj: t.ObjLib;

  /** Rounds a number to the specified number of decimal places. */
  round: t.NumLib['round'];

  /** Determine if the given input is typeof {object} and not Null. */
  isObject(input: unknown): input is object;

  /** Determine if the given input is a simple {key:value} record object.  */
  isRecord(input: unknown): input is O;

  /**
   * Toggle the value of a boolean {object} key.
   * WARNING:
   *    This manipulates the given object.
   *    Ensure an immutable-safe object is passed.
   */
  toggle<T extends O | any[]>(
    mutate: T,
    key: T extends any[] ? number : keyof T,
    defaultValue?: boolean,
  ): boolean;
};
