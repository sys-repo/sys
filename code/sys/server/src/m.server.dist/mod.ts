/**
 * @module
 * Materialize externally pinned remote Dist packages as immutable verified generations.
 */
import type { t } from './common.ts';
import { materialize } from './u.materialize.ts';

export type * from './t.ts';

/** Immutable verified Dist materialization. */
export const Dist: t.ServerDist.Lib = Object.freeze({ materialize });
