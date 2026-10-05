import type { t } from './common.ts';
import { children } from './u.log/u.children.ts';
import { dist } from './u.log/u.dist.ts';

/** Logging helpers for the PkgDist data. */
export const Log: t.Pkg.Dist.Log.Lib = Object.freeze({ dist, children });
