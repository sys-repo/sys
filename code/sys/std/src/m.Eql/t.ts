/**
 * Structural equality helper contracts.
 */
export declare namespace Eql {
  /**
   * Runtime library surface.
   */
  export type Lib = {
    /** Compare two values using the supported structural equality relation. */
    readonly deep: (a: unknown, b: unknown) => boolean;

    /** Return the first value from each structural-equality class. */
    readonly unique: <T>(values: T[]) => T[];

    /** Return the first item for each structurally unique key. */
    readonly uniqueBy: <T>(fn: (value: T) => unknown, values: T[]) => T[];
  };
}
