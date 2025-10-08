import { type t } from './common.ts';

/**
 * Removes the smallest common indentation from all non-blank lines
 * of a multi-line string, preserving relative structure.
 * - Ignores a leading newline (typical of template literals).
 * - Normalizes CRLF.
 * - Pops a single trailing empty line *after* de-indentation (from closing backtick indentation).
 *   (Preserves whitespace-only lines elsewhere.)
 */
export const dedent: t.StrLib['dedent'] = (str) => {
  const normalized = str.replace(/\r\n?/g, '\n');
  const lines = normalized.replace(/^\n/, '').split('\n');

  // Compute min indent from non-blank lines.
  const indents = lines
    .filter((l) => l.trim().length > 0)
    .map((l) => l.match(/^[ \t]*/)?.[0].length ?? 0);
  const min = indents.length > 0 ? Math.min(...indents) : 0;

  // De-indent.
  const out = lines.map((l) => l.slice(Math.min(min, l.length)));

  // If de-indentation produced a trailing empty line, drop exactly one.
  if (out.length > 0 && out[out.length - 1] === '') out.pop();

  return out.join('\n');
};
