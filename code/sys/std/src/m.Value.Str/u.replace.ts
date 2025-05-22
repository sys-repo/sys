import type { t } from './common.ts';

export const replaceAll: t.StrLib['replaceAll'] = (before, pattern, replacement) => {
  const regex = normalizeRegex(pattern);
  const after = before.replace(regex, replacement);
  const changed = before !== after;
  return { changed, before, after };
};

/**
 * Helpers:
 */
function normalizeRegex(pattern: string | RegExp): RegExp {
  // Normalize to a global, multiline RegExp:
  if (typeof pattern === 'string') return new RegExp(pattern, 'gm');
  return pattern.flags.includes('g') ? pattern : new RegExp(pattern.source, pattern.flags + 'g');
}
