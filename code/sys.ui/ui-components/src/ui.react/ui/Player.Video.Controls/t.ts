import { type t } from './common.ts';

export type * from './t.component.ts';
export type * from './t.hook.ts';

/** Video player controls renderer and pending-seek hook surface. */
export type VideoPlayerControlsLib = {
  readonly UI: t.FC<t.PlayerControlsProps>;
  readonly usePendingSeek: t.UsePendingSeek;
};
