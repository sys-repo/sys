import { effect, signal } from '@preact/signals-core';
import type { t } from './common.ts';

export { signal };

/**
 * Reactive Signals.
 * (via `preact/signals`): https://preactjs.com/guide/v10/signals
 */
export const Signal: t.SignalLib = {
  create: signal,
  effect,
} as const;
