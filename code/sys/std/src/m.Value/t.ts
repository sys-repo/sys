import type { t } from '../common.ts';

/**
 * Library: Tools for evaluating and manipulating types of values.
 */
export type ValueLib = {
  /**
   * Tools for working with array.
   */
  Array: t.ArrayLib;

  /* Library: Tools for working with numbers. */
  Num: t.NumLib;

  /* Library: Tools for working with strings. */
  Str: t.StrLib;

  /* Rounds a number to the given number of decimal places. */
  round: t.NumLib['round'];

  /* Determine if the given input is typeof "object" and not <null>. */
  isObject(input: unknown): input is object;
};

/**
 * Library: Tools for working with numbers.
 */
export type NumLib = {
  /**
   * Rounds a number to the given number of decimal places.
   */
  round(value: number, precision?: number): number;
};

/**
 * Library: Tools for working with strings.
 */
export type StrLib = {
  /* Capitalize the given word. */
  capitalize(word: string): string;
};
