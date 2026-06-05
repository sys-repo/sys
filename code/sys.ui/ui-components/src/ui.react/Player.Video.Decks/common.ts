import { type t, pkg, Pkg } from '../common.ts';
import { D as VIDEO_DEFAULTS } from '../Player.Video.Element/common.ts';

export * from '../common.ts';
export { usePlayerSignals, VideoElement } from '../Player.Video.Element/mod.ts';
export { VideoSignals } from '../Player.Video.Signals/mod.ts';
export { PlayerControls } from '../Player.Video.Controls/mod.ts';

/**
 * Constants:
 */
const name = 'VideoDecks';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  aspectRatio: VIDEO_DEFAULTS.aspectRatio,
  active: 'A' satisfies t.VideoDecksActive,
  show: 'both' satisfies t.VideoDecksProps['show'],
  muted: false,
  gap: 6,
} as const;

export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
