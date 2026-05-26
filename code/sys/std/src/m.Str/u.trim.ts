import type { t } from './common.ts';

/**
 * Remove leading/trailing newlines only — preserves internal and first-char whitespace.
 */
export const trimEdgeNewlines: t.Str.Lib['trimEdgeNewlines'] = (str = '') => {
  return (
    str
      // Normalize all CRLF → LF:
      .replace(/\r\n/g, '\n')
      // Remove leading/trailing blank lines (allowing spaces/tabs):
      .replace(/^\s*\n+|\n+\s*$/g, '')
  );
};

/**
 * Remove all leading and trailing forward slashes (`/`) from a string.
 */
export const trimSlashes: t.Str.Lib['trimSlashes'] = (str = '') => {
  return trimTrailingSlashes(trimLeadingSlashes(str));
};

/**
 * Remove all leading forward slashes (`/`) from a string.
 */
export const trimLeadingSlashes: t.Str.Lib['trimLeadingSlashes'] = (str = '') => {
  return str.replace(/^\/+/, '');
};

/**
 * Remove all trailing forward slashes (`/`) from a string.
 */
export const trimTrailingSlashes: t.Str.Lib['trimTrailingSlashes'] = (str = '') => {
  return str.replace(/\/+$/, '');
};

/**
 * Remove a leading HTTP or HTTPS scheme (`http://` or `https://`) from a string.
 *
 *  - Purely lexical (no URL parsing)
 *  - Removes the scheme only once
 *  - Safe for undefined / empty input
 *
 * @example
 * Str.trimHttpScheme("https://example.com") // → "example.com"
 * Str.trimHttpScheme("http://example.com")  // → "example.com"
 */
export const trimHttpScheme: t.Str.Lib['trimHttpScheme'] = (str = '') => {
  return str.replace(/^https?:\/\//, '');
};

/**
 * Remove one or more leading `./` segments from a string.
 *
 * - Purely lexical (not path-semantic)
 * - Safe for undefined / empty input
 * - Removes repeated leading `./` only
 * - Does not touch internal or trailing content
 *
 * @example
 * Str.trimLeadingDotSlash("./foo/bar") // → "foo/bar"
 * Str.trimLeadingDotSlash("././foo")   // → "foo"
 * Str.trimLeadingDotSlash("foo/bar")   // → "foo/bar"
 */
export const trimLeadingDotSlash: t.Str.Lib['trimLeadingDotSlash'] = (str = '') => {
  return str.replace(/^(?:\.\/)+/, '');
};
