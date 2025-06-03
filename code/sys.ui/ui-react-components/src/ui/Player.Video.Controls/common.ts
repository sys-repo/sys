import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';
export { Button } from '../Button/mod.ts';

/**
 * Constants:
 */
const name = 'Media.Player.Video.Controls';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  playing: false,
  muted: false,
} as const;
export const D = DEFAULTS;
