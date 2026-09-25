import type { t } from './common.ts';
import { open } from './u.generation/mod.ts';
import { materialize } from './u.materialize/mod.ts';

/**
 * Checksum-pinned Dist materialization and retained generation ownership.
 */
export const Dist: t.Dist.Lib = Object.freeze({
  materialize,
  Generation: Object.freeze({ open }),
});
