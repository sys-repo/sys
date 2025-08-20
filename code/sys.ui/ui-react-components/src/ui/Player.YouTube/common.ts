import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Player.Youtube';
export const DEFAULTS = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const D = DEFAULTS;
