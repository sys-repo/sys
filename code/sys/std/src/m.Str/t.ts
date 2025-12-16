import type { Options as FormatOptions } from 'pretty-bytes';
import type { t } from './common.ts';

/** Type re-exports */
export type * from './t.builder.ts';

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
  /** White space (not collapsed by Posix/Linux log digests). */
  readonly SPACE: '\u200B';

  /** The "lorem ipsum" helper library. */
  readonly Lorem: StrLoremLib;
  /** The "lorem ipsum" string. */
  readonly lorem: string;

  /** Calculate a difference between two strings. */
  diff: t.TextDiffCalc;

  /** Capitalize the given word. */
  capitalize(word: string): string;

  /** Return the "singular" or "plural" version of a word based on a number. */
  plural(count: number, singular: string, plural?: string): string;

  /** Converts a "camelCase" string to "kebab-case". */
  camelToKebab(text: string): string;

  /** Convert bytes to a human-readable string, eg: 1337 → "1.34 kB". */
  bytes: t.FormatBytes;

  /**
   * Truncates a string with an ellipsis if it exceeds the given maximum length.
   * - Handles undefined/empty input safely.
   * - Respects variable-length ellipsis (default '…').
   * - Avoids negative slice values for very small max.
   */
  truncate(text: string | undefined, max: number, opts?: { ellipsis?: string }): string;

  /**
   * Inserts an ellipsis into the middle of a string if it exceeds the given maximum length.
   * - If `max` is a single number, start and end segments are split evenly.
   * - If `max` is a tuple `[left, right]`, custom lengths are used for start and end.
   * - Handles undefined/empty input safely.
   * - Respects variable-length ellipsis (default '…').
   */
  ellipsize(
    text: string | undefined,
    max: number | readonly [number, number],
    opts?: { ellipsis?: string } | string,
  ): string;

  /**
   * Replace all matches of the given pattern in a single or multi-line string.
   */
  replaceAll(
    before: string,
    pattern: string | RegExp,
    replacement: string,
  ): { readonly changed: boolean; readonly before: string; readonly after: string };

  /**
   * Adds a fixed indentation to all non-blank lines of a multi-line string.
   */
  indent(str: string, chars: number, opts?: { char?: string }): string;

  /**
   * Removes the smallest common indentation from all non-blank lines
   * of a multi-line string, preserving relative structure.
   */
  dedent(str: string): string;

  /**
   * Remove leading/trailing newlines only — preserves internal and first-char whitespace.
   */
  trimEdgeNewlines(str?: string): string;

  /**
   * Remove all leading forward slashes (`/`) from a string.
   *
   * - Purely lexical (not path-semantic)
   * - Safe for undefined / empty input
   * - Does not touch internal or trailing slashes
   *
   * @example
   * Str.trimLeadingSlashes("/foo/bar") // → "foo/bar"
   * Str.trimLeadingSlashes("///foo")   // → "foo"
   */
  trimLeadingSlashes(str?: string): string;

  /**
   * Remove all trailing forward slashes (`/`) from a string.
   *
   * - Purely lexical (not path-semantic)
   * - Safe for undefined / empty input
   * - Does not touch internal or leading slashes
   *
   * @example
   * Str.trimTrailingSlashes("foo/bar/") // → "foo/bar"
   * Str.trimTrailingSlashes("foo///")   // → "foo"
   */
  trimTrailingSlashes(str?: string): string;

  /**
   * Remove all leading and trailing forward slashes (`/`) from a string.
   *
   * - Purely lexical (not path-semantic)
   * - Safe for undefined / empty input
   * - Does not touch internal slashes
   *
   * @example
   * Str.trimSlashes("/foo/bar/") // → "foo/bar"
   * Str.trimSlashes("///foo///") // → "foo"
   */
  trimSlashes(str?: string): string;

  /** Count non-overlapping occurrences of a substring. */
  count(text: string, sub: string): number;

  /** Create a new string builder. */
  builder(options?: t.StrBuilderOptions): t.StrBuilder;
};

/**
 * Tools for working with sample "lorem ipsum..." text.
 */
export type StrLoremLib = {
  readonly text: string;
  toString(): string;
  words(count?: number): string;
};
