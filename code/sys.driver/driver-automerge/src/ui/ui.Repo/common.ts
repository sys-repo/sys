import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Repo';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  syncEnabled: true,
} as const;
export const D = DEFAULTS;
