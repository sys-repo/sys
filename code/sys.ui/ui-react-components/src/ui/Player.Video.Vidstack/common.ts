import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';
export { playerSignalsFactory } from '../Player.Video.signals/mod.ts';

/**
 * Constants
 */
const name = 'Player.Video';

export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),

  video: 'vimeo/499921561', // Tubes.

  loop: false,
  showFullscreenButton: false,
  showVolumeControl: true,
  showControls: true,
  cornerRadius: 0,
  aspectRatio: '16/9',
  autoPlay: false,
  muted: false,
  background: false,
  scale: 1,
} as const;
export const D = DEFAULTS;
