import { type t, pkg, Pkg } from '../common.ts';

export * from '../common.ts';

export { Button } from '../Button/mod.ts';
export { Slider } from '../Slider/mod.ts';
export { BarSpinner } from '../Spinners.Bar/mod.ts';

type P = t.PlayerControlsProps;

/**
 * Constants:
 */
const name = 'Media.Player.Video.Controls';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  enabled: true,
  playing: false,
  muted: false,
  buffering: false,
  maskHeight: 80,
  maskOpacity: 1,
  background: { opacity: 0, rounded: 12, blur: 10, shadow: true } satisfies P['background'],
  padding: 10,
} as const;
export const D = DEFAULTS;
