import { type t } from './common.ts';
import { init } from './u.init.ts';
import { reduce } from './u.reduce.ts';

export const Playback: t.PlaybackStateLib = {
  init,
  reduce,
};
