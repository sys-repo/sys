import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'MenuList';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  selected: undefined,
} as const;
export const D = DEFAULTS;
