import { batch, computed, effect, signal } from '@preact/signals-core';

import type { t } from './common.ts';
import { cycle } from './u.cycle.ts';
import { toggle } from './u.toggle.ts';

export { signal };

/**
 * Reactive Signals.
 * See:
 *    https://github.com/tc39/proposal-signals
 *    https://preactjs.com/blog/introducing-signals/
 *    https://preactjs.com/guide/v10/signals
 */
export const Signal: t.SignalLib = {
  create: signal,
  effect,
  computed,
  batch,
  toggle,
  cycle,
} as const;
