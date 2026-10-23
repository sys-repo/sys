import { Is, type t } from '../common.ts';

export const replaceAll: t.Str.Lib['replaceAll'] = (before, pattern, replacement) => {
  const after = before.replace(normalizeRegex(pattern), replacement);
  return { changed: before !== after, before, after };
};

/**
 * Helpers:
 */
function normalizeRegex(pattern: string | RegExp): RegExp {
  if (Is.string(pattern)) return new RegExp(pattern, 'gm');
  return pattern.flags.includes('g')
    ? pattern
    : new RegExp(pattern.source, `${pattern.flags}g`);
}
