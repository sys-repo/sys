import { batch, computed, effect, signal } from '@preact/signals-core';

import type { t } from './common.ts';
import { cycle } from './u.cycle.ts';
import { toggle } from './u.toggle.ts';
import { listeners } from './u.listeners.ts';

export { signal };

/**
 * Reactive Signals.
 * See:
 *    https://github.com/tc39/proposal-signals
 *    https://preactjs.com/blog/introducing-signals/
 *    https://preactjs.com/guide/v10/signals
 */
export const Signal: t.SignalLib = {
  /**
   * Primary API:
   */
  create: signal,
  effect,
  computed,
  batch,

  /**
   * Helpers:
   */
  listeners,
  toggle,
  cycle,
} as const;
