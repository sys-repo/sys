/**
 * Regular-expression helper contracts.
 */
export declare namespace Regex {
  /**
   * Helpers for working with regular-expressions.
   */
  export type Lib = {
    /**
     * Escapes special characters in a string to be used in a regular expression.
     * @param input The string to escape.
     * @returns The escaped string.
     */
    escape(input: string): string;
  };
}
