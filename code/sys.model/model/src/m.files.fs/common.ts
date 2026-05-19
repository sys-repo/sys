import type { t } from '../common.ts';

export * from '../common.ts';

/**
 * Defaults:
 */
export const DEFAULTS = {
  pageLimit: 200 satisfies t.Files.Limit,
  encoding: 'utf8' satisfies t.Files.Encoding,
  encodings: ['utf8'] satisfies readonly t.Files.Encoding[],
} as const;
export const D = DEFAULTS;
