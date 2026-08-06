import type { t } from './common.ts';
import { materialize } from './u.materialize.ts';

/** Checksum-pinned Dist materialization. */
export const Dist: t.Dist.Lib = Object.freeze({ materialize });
