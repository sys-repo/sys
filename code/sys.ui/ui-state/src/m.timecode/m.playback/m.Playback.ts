import { type t } from './common.ts';

import { activePhase } from './u.activePhase.ts';
import { beatIndexAtVTime } from './u.beatIndexAtVTime.ts';
import { buildTimeline } from './u.buildTimeline.ts';
import { init } from './u.init.ts';
import { reduce } from './u.reduce.ts';
import { PlaybackIs as Is } from './m.Is.ts';

export const Playback: t.PlaybackStateLib = {
  init,
  reduce,
  Is,
  Util: { buildTimeline, activePhase, beatIndexAtVTime },
};
