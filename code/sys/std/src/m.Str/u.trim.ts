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
  return str.replace(/^\/+/, '').replace(/\/+$/, '');
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
