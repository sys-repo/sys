import type { Options as FormatOptions } from 'pretty-bytes';
import type { t } from './common.ts';

/**
 * Convert bytes to a human-readable string: "1337 → 1.34 kB".
 */
export type FormatBytes = (num?: number, options?: FormatBytesOptions) => string;

/** Options for formatting bytes → strings. */
export type FormatBytesOptions = FormatOptions & {};

/**
 * Tools for working on strings of text.
 */
export type StrLib = {
  readonly Lorem: StrLoremLib;

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
   * Converts a "camelCase" string to "kebab-case".
   */
  camelToKebab(text: string): string;

  /**
   * Convert bytes to a human-readable string, eg: 1337 → "1.34 kB".
   */
  bytes: t.FormatBytes;

  /**
   * Truncates a string with ellipsis if over a maximum length.
   */
  truncate(text: string | undefined, max: number): string;
};

/**
 * Tools for working with sample "lorem ipsum..." text.
 */
export type StrLoremLib = {
  readonly text: string;
  toString(): string;
};
