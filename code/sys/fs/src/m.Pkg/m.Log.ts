import { type t } from './common.ts';
import { children } from './u/u.log.children.ts';
import { dist } from './u/u.log.dist.ts';

/**
 * Logging helpers for the PkgDist data.
 */
export const Log: t.Pkg.Dist.Log.Lib = {
  dist,
  children,
};
