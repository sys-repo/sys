import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

export { IFrame } from '../IFrame/mod.ts';

/**
 * Constants:
 */
const name = 'Player.Youtube';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  width: 560,
  height: 315,
} as const;
export const D = DEFAULTS;
