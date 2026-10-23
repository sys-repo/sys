import type { t } from '../common.ts';

export * from '../common.ts';

/**
 * Defaults for in-memory Files backings.
 *
 * Runtime freeze is intentional: these values are reused as advertised
 * capability facts, so mutation must not widen or misreport authority.
 */
export const DEFAULTS = Object.freeze({
  pageLimit: 200 satisfies t.Files.Limit,
  encoding: 'utf8' satisfies t.Files.Encoding,
  encodings: Object.freeze(['utf8'] satisfies readonly t.Files.Encoding[]),
});
export const D = DEFAULTS;
