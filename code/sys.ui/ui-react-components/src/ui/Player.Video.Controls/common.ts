import { pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export { Button } from '../Button/mod.ts';
export { Slider } from '../Slider/mod.ts';
export { BarSpinner } from '../Spinners.Bar/mod.ts';

/**
 * Constants:
 */
const name = 'Media.Player.Video.Controls';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  playing: false,
  muted: false,
  maskHeight: 80,
  maskOpacity: 1,
  buffering: false,
  enabled: true,
} as const;
export const D = DEFAULTS;
