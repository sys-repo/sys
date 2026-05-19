import type { t } from '../common.ts';

export * from '../common.ts';

/** Defaults for the static dist Files backing. */
export const DEFAULTS = Object.freeze({
  defaultLimit: 200 satisfies t.Files.Limit,
  fidelity: 'snapshot' satisfies t.Files.Fidelity,
  encoding: 'utf8' satisfies t.Files.Encoding,
});

export const D = DEFAULTS;
