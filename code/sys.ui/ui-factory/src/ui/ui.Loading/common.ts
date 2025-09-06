import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Loading';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  fadeInDuration: 2000,
} as const;
export const DEFAULTS = D;
