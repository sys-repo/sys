import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.orbiter.ts';

/**
 * Union of all supported deploy providers.
 * Extend by adding new `{ kind: "<name>" }` variants.
 */
export type DeployProvider = t.OrbiterProvider;
