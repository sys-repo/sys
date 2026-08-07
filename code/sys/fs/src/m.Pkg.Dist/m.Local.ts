import { type t } from './common.ts';
import { verifyLocal } from './u.verify/u.pinned.ts';

/** Local-generation verification operations. */
export const Local: t.Pkg.Dist.Local.Lib = Object.freeze({ verify: verifyLocal });
