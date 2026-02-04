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

  /** Algorithms for performing string comparisons when sorting. */
  readonly Compare: t.StrCompareLib;

  /** The "lorem ipsum" helper library. */
  readonly Lorem: StrLoremLib;
  /** The "lorem ipsum" string. */
  readonly lorem: string;

  /** Create a new string builder. */
  builder(options?: t.StrBuilderOptions): t.StrBuilder;

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

  /** Count non-overlapping occurrences of a substring. */
  count(text: string, sub: string): number;

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

  /**
   * Remove an `http://` or `https://` scheme prefix from a string.
   *
   *  - Purely lexical (not URL-semantic)
   *  - Safe for undefined / empty input
   *  - Only removes the HTTP(S) scheme prefix (no other schemes)
   *
   * @example
   * Str.trimHttpScheme("https://example.com") // → "example.com"
   * Str.trimHttpScheme("http://localhost:4040") // → "localhost:4040"
   * Str.trimHttpScheme("example.com") // → "example.com"
   */
  trimHttpScheme(str?: string): string;

  /**
   * Remove a leading `./` (or repeated `././`) prefix from a string.
   *
   * - Purely lexical (not path-semantic)
   * - Safe for undefined / empty input
   * - Removes one or more leading `./` segments only
   * - Does not touch internal or trailing content
   *
   * @example
   * Str.trimLeadingDotSlash("./foo/bar")    // → "foo/bar"
   * Str.trimLeadingDotSlash("././foo")      // → "foo"
   * Str.trimLeadingDotSlash("foo/bar")      // → "foo/bar"
   */
  trimLeadingDotSlash(str?: string): string;

  /**
   * Remove a leading prefix from a string exactly once, if present.
   *
   * - Purely lexical (no path or URL semantics)
   * - Removes the prefix only if it is an exact leading match
   * - Never removes more than once
   * - Safe for undefined / empty input
   *
   * @example
   * Str.stripPrefixOnce("/foo/bar", "/foo") // → "/bar"
   * Str.stripPrefixOnce("foo/bar", "/foo")  // → "foo/bar"
   */
  stripPrefixOnce(str: string | undefined, prefix: string): string;

  /**
   * Split a string into path-like segments.
   *
   * - Splits on one or more forward or back slashes (`/` or `\`)
   * - Removes empty segments
   * - Purely lexical (no path semantics, no `.` / `..` handling)
   *
   * @example
   * Str.splitPathSegments("foo/bar/baz")      // → ["foo", "bar", "baz"]
   * Str.splitPathSegments("/foo//bar/")       // → ["foo", "bar"]
   * Str.splitPathSegments("foo\\bar\\baz")    // → ["foo", "bar", "baz"]
   * Str.splitPathSegments("")                 // → []
   */
  splitPathSegments(str?: string): readonly string[];

  /**
   * Ensure a string is wrapped with exactly one leading and trailing `/`.
   *
   * - Purely lexical (not path-semantic)
   * - Trims surrounding whitespace
   * - Collapses duplicate edge slashes
   * - Guarantees a non-empty result (`'/'` is the canonical empty)
   *
   * @example
   * Str.ensureSlashWrapped("foo")        // → "/foo/"
   * Str.ensureSlashWrapped("/foo")       // → "/foo/"
   * Str.ensureSlashWrapped("foo/")       // → "/foo/"
   * Str.ensureSlashWrapped("/foo/")      // → "/foo/"
   * Str.ensureSlashWrapped("///foo///")  // → "/foo/"
   * Str.ensureSlashWrapped("")           // → "/"
   */
  ensureSlashWrapped(str?: string): string;

  /**
   * Remove the final path segment from a slash-delimited string.
   *
   * - Purely lexical (not filesystem- or URL-semantic)
   * - Removes everything after the last `/`
   * - Preserves leading structure
   * - Safe for undefined / empty input
   *
   * @example
   * Str.stripTrailingPathSegment("/foo/bar")   // → "/foo"
   * Str.stripTrailingPathSegment("/foo/bar/")  // → "/foo/bar"
   * Str.stripTrailingPathSegment("foo")        // → ""
   */
  stripTrailingPathSegment(str?: string): string;
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
 * Algorithms for performing string comparisons when sorting.
 */
export type StrCompareLib = {
  /**
   * Natural string comparator factory (numeric segments sort numerically).
   */
  natural(options?: StrCompareOptions): (a: string, b: string) => number;
};

/** Options for string comparison algorithms. */
export type StrCompareOptions = {
  readonly locale?: string;
  readonly sensitivity?: Intl.CollatorOptions['sensitivity'];
};
