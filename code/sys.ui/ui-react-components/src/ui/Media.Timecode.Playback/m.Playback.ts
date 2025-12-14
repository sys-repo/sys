import { type t } from './common.ts';
import { createRunner as runner } from './u.createRunner.ts';

export const Playback: t.TimecodePlaybackLib = {
  runner,
};
