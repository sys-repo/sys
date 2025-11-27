import { type t } from './common.ts';

/**
 * Adds a fixed indentation to all non-blank lines of a multi-line string.
 * - Preserves the relative indentation between lines.
 * - Blank/whitespace-only lines are left untouched.
 * - Default indent character is a single space.
 */
export const indent: t.StrLib['indent'] = (str, chars, opts = {}) => {
  if (!str || chars <= 0) return str;

  const ch = opts.char ?? ' ';
  const pad = ch.repeat(chars);

  return str
    .split('\n')
    .map((line) => (line.trim() === '' ? line : pad + line))
    .join('\n');
};
