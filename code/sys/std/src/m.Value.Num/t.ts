/**
 * Tools for working with numbers.
 */
export type NumLib = {
  /**
   * Rounds a number to the specified number of decimal places.
   */
  round(value: number, precision?: number): number;

  /**
   * Convert the value to a simple number-hash.
   * "fast, consistent, unique hashCode" on any JS value object.
   */
  hash<T>(value: T): number;
};
