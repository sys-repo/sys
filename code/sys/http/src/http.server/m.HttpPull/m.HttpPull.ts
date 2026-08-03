import type { t } from './common.ts';
import { start } from './u/u.start.ts';

/**
 * Materialize checksum-pinned resources through one bounded Rooted operation.
 */
export const HttpPull: t.HttpPull.Lib = { start };
