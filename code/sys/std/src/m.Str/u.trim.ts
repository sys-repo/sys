import type { t } from './common.ts';

/**
 * Remove leading/trailing newlines only — preserves internal and first-char whitespace.
 */
export const trimEdgeNewlines: t.StrLib['trimEdgeNewlines'] = (str = '') => {
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
export const trimSlashes: t.StrLib['trimSlashes'] = (str = '') => {
  return trimTrailingSlashes(trimLeadingSlashes(str));
};

/**
 * Remove all leading forward slashes (`/`) from a string.
 */
export const trimLeadingSlashes: t.StrLib['trimLeadingSlashes'] = (str = '') => {
  return str.replace(/^\/+/, '');
};

/**
 * Remove all trailing forward slashes (`/`) from a string.
 */
export const trimTrailingSlashes: t.StrLib['trimTrailingSlashes'] = (str = '') => {
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
export const trimHttpScheme: t.StrLib['trimHttpScheme'] = (str = '') => {
  return str.replace(/^https?:\/\//, '');
};
