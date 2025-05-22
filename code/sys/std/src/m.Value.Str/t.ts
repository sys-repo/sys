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
  /** The "lorem ipsum" helper library. */
  readonly Lorem: StrLoremLib;
  /** The "lorem ipsum" string. */
  readonly lorem: string;

  /** Helpers for replacing strings within immutable documents. */
  readonly Doc: StringDocLib;

  /** Calculate a difference between two strings. */
  diff: t.TextDiffCalc;

  /** Limit the length of a string inserting ellipsis when needed. */
  shorten(input?: string, maxLength?: number, options?: { ellipsis?: string }): string;

  /** Capitalize the given word. */
  capitalize(word: string): string;

  /** Return the "singular" or "plural" version of a word based on a number. */
  plural(count: number, singular: string, plural?: string): string;

  /** Converts a "camelCase" string to "kebab-case". */
  camelToKebab(text: string): string;

  /** Convert bytes to a human-readable string, eg: 1337 → "1.34 kB". */
  bytes: t.FormatBytes;

  /** Truncates a string with ellipsis if over a maximum length. */
  truncate(text: string | undefined, max: number): string;

  /** Replace all matches of the given pattern in a single or multi-line string. */
  replaceAll(
    before: string,
    pattern: string | RegExp,
    replacement: string,
  ): { readonly changed: boolean; readonly before: string; readonly after: string };
};

/**
 * Tools for working with sample "lorem ipsum..." text.
 */
export type StrLoremLib = {
  readonly text: string;
  toString(): string;
  words(count?: number): string;
};

/**
 * Helpers for replacing strings within immutable documents.
 */
export type StringDocLib = {
  /** Safely modify a string stored on an immutable object <T>. */
  splice: t.TextSplice;
  /** Replace all of a string using splice. */
  replace: t.TextReplace;
};
