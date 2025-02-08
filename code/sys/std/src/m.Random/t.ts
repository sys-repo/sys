/**
 * Tools for generating random values.
 */
export type RandomLib = {
  /** Length constants */
  readonly Length: { readonly cuid: number; readonly slug: number };

  /** Generates a random base-36 string of exactly the specified length. */
  base36(length: number): string;

  /**
   * Generate a non-sequental identifier.
   * IMPORTANT
   *    DO NOT put "slugs" into databases as keys.
   *    Use the longer "cuid" for that.
   */
  slug(): string;

  /**
   * Generates a short, collision-resistant ID.
   * Uses timestamp, an incrementing counter, and random bytes.
   *
   * @param length The total desired length of the generated CUID-like string.
   *               If not provided, a default length is used.
   * @returns A collision-resistant string of the specified length.
   */
  cuid(length?: number): string;
};
