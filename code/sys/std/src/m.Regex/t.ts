import type { t } from './common.ts';

/**
 * Helpers for working with regular-expressions.
 */
export type RegexLib = {
  /**
   * Escapes special characters in a string to be used in a regular expression.
   * @param input The string to escape.
   * @returns The escaped string.
   */
  escape(input: string): string;
};
