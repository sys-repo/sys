import type { t } from './common.ts';
import { frames as waitFrames } from './u/u.frames.ts';
import { queue } from './u/u.queue.ts';
import { makeScheduleFn } from './u/u.scheduleFunction.ts';
import { sleep } from './u/u.sleep.ts';
import { tick, waitFor } from './u/u.turn.ts';

const raf = makeScheduleFn('raf');

/**
 * Minimal, consistent API for deferring work (microtask, macrotask, or frame),
 * with lifecycle-aware and static forms.
 */
export const Schedule: t.Schedule.Lib = {
  make: (life, mode = 'micro') => makeScheduleFn(mode, life),
  queue,
  sleep,
  tick,
  waitFor,

  async frames(count = 1) {
    await waitFrames(count, raf);
  },

  // Static schedulers (no lifecycle):
  micro: makeScheduleFn('micro'),
  macro: makeScheduleFn('macro'),
  raf,
};
