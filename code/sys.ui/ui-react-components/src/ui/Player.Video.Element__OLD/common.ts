import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';
export { PlayerControls } from '../Player.Video.Controls/mod.ts';

/**
 * Constants:
 */
const name = 'Media.Player.VideoElement';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  aspectRatio: '16/9',
  cornerRadius: 0,
  autoPlay: false,
  showControls: true,
  scale: 1,
  buffering: false,
} as const;
export const D = DEFAULTS;
