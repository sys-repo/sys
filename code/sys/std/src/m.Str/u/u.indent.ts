import type { t } from '../common.ts';

/**
 * Add fixed indentation to each non-blank line while preserving relative
 * indentation and whitespace-only lines.
 */
export const indent: t.Str.Lib['indent'] = (str, chars, options = {}) => {
  if (!str || chars <= 0) return str;

  const pad = (options.char ?? ' ').repeat(chars);
  return str
    .split('\n')
    .map((line) => (line.trim() === '' ? line : pad + line))
    .join('\n');
};
