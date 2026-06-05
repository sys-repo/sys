import { type t } from './common.ts';

export type * from './t.component.ts';
export type * from './t.hook.ts';

export type VideoPlayerControlsLib = {
  readonly UI: t.FC<t.PlayerControlsProps>;
  readonly usePendingSeek: t.UsePendingSeek;
};
