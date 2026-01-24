import { type t, pkg, Pkg } from '../common.ts';
import { D as VIDEO_DEFAULTS } from '../Player.Video.Element/common.ts';

export * from '../common.ts';
export { VideoSignals } from '../Player.Video.Signals/mod.ts';

type P = t.VideoDecksProps;

/**
 * Constants:
 */
const name = 'VideoDecks';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  aspectRatio: VIDEO_DEFAULTS.aspectRatio,
  active: 'A' satisfies t.VideoDecksProps['active'],
  muted: false,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
