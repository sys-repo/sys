import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

import { DEFAULTS as CONTROLS_DEFAULTS } from '../Player.Video.Controls/common.ts';

export { Button } from '../Button/mod.ts';
export { KeyValue } from '../KeyValue/mod.ts';
export { BarSpinner } from '../Spinners.Bar/mod.ts';
export { Icons } from '../ui.Icons.ts';
export { bumpEndedTick } from '../Player.Video.Signals/u.ts';

export * from './const.READY_STATE.ts';

type P = t.VideoElementProps;

/**
 * Constants:
 */
const name = 'VideoElement';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  scale: 1,
  loop: false,
  aspectRatio: '16/9',
  cornerRadius: 0,
  showControls: true,
  controls: {
    background: CONTROLS_DEFAULTS.background,
  } satisfies NonNullable<t.VideoElementProps['controls']>,
  interaction: {
    clickToPlay: true,
  } satisfies NonNullable<P['interaction']>,
} as const;
export const D = DEFAULTS;
