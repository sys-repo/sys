import type { t } from './common.ts';
import type { format as formatBytes, FormatOptions } from '@std/fmt/bytes';

/**
 * Library: Tools for working on strings of text.
 */
export type TextLib = {
  /**
   * Calculate a difference between two strings.
   */
  diff: t.TextDiffCalc;

  /**
   * Safely modify a string stored on an immutable object <T>.
   */
  splice: t.TextSplice;

  /**
   * Replace all of a string using splice.
   */
  replace: t.TextReplace;

  /**
   * Limit the length of a string inserting ellipsis when needed.
   */
  shorten(input?: string, maxLength?: number, options?: { ellipsis?: string }): string;

  /**
   * Capitalize the given word.
   */
  capitalize(word: string): string;

  /**
   * Return the "singular" or "plural" version of a word based on a number.
   */
  plural(count: number, singular: string, plural?: string): string;

  /**
   * Convert bytes to a human-readable string, eg: 1337 → "1.34 kB".
   */
  bytes: t.FormatBytes;
};

/**
 * Convert bytes to a human-readable string: "1337 → 1.34 kB".
 */
export type FormatBytes = (num: number, options?: FormatOptions) => string;
