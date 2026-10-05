import type { t } from '../common.ts';

export * from '../common.ts';

/**
 * Defaults for the static dist Files backing.
 *
 * Runtime freeze is intentional: these values are reused as advertised
 * capability facts, so mutation must not widen or misreport authority.
 */
export const DEFAULTS = Object.freeze({
  defaultLimit: 200 satisfies t.Files.Limit,
  fidelity: 'snapshot' satisfies t.Files.Fidelity,
  encoding: 'utf8' satisfies t.Files.Encoding,
});

export const D = DEFAULTS;
