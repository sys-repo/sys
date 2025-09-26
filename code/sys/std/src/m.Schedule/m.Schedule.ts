import { type t } from './common.ts';
import { makeScheduleFn } from './u.scheduleFunction.ts';

/**
 * Minimal, consistent API for deferring work (microtask, macrotask, or frame),
 * with lifecycle-aware and static forms.
 */
export const Schedule: t.SchedulerLib = {
  make: (life, mode = 'micro') => makeScheduleFn(mode, life),

  async frames(count = 1) {
    const n = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
    for (let i = 0; i < n; i += 1) await Schedule.raf();
  },

  // Static schedulers (no lifecycle):
  micro: makeScheduleFn('micro'),
  macro: makeScheduleFn('macro'),
  raf: makeScheduleFn('raf'),
};
