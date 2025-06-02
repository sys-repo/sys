import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Media.VideoElement';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  aspectRatio: '16/9',
  cornerRadius: 0,
  autoPlay: false,
  showControls: true,
} as const;
export const D = DEFAULTS;
