import { type t } from './common.ts';

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

// 🌸🌸 ---------- ADDED: trim-leading-slashes ----------

/**
 * Remove all leading forward slashes (`/`) from a string.
 *
 * - Purely lexical (not path-semantic)
 * - Safe for undefined / empty input
 * - Does not touch internal or trailing slashes
 */
export const trimLeadingSlashes: t.StrLib['trimLeadingSlashes'] = (str = '') => {
  return str.replace(/^\/+/, '');
};

// 🌸 ---------- /ADDED ----------
