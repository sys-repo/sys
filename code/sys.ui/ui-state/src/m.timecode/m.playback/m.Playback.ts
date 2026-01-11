import { type t } from './common.ts';

import { activePhase } from './u.activePhase.ts';
import { buildTimeline } from './u.buildTimeline.ts';
import { init } from './u.init.ts';
import { reduce } from './u.reduce.ts';

export const Playback: t.PlaybackStateLib = {
  init,
  reduce,
  Util: { buildTimeline, activePhase },
};
