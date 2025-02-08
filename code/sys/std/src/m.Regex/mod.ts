/**
 * @module
 * Helpers for working with regular-expressions.
 */
import type { t } from './common.ts';

export const Regex: t.RegexLib = {
  /**
   * Escapes special characters in a string to be used in a regular expression.
   * @param input The string to escape.
   * @returns The escaped string.
   */
  escape(input) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },
};
