import { type t } from './common.ts';
import { children } from './u.log.children.ts';
import { dist } from './u.log.dist.ts';

/**
 * Logging helpers for the PkgDist data.
 */
export const Log: t.PkgDistLog = {
  dist,
  children,
};
