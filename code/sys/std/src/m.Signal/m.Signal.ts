import { batch, computed, effect, signal } from '@preact/signals-core';

import type { t } from './common.ts';
import { Is } from './m.Is.ts';
import { cycle } from './u.cycle.ts';
import { listeners } from './u.listeners.ts';
import { toggle } from './u.toggle.ts';
import { toObject } from './u.toObject.ts';

export { signal };

/**
 * Reactive Signals.
 * See:
 *    https://github.com/tc39/proposal-signals
 *    https://preactjs.com/blog/introducing-signals/
 *    https://preactjs.com/guide/v10/signals
 */
export const Signal: t.SignalLib = {
  Is,

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
  toObject,
} as const;
