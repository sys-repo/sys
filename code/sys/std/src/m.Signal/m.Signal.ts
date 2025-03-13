import { effect, signal } from '@preact/signals-core';
import type { t } from './common.ts';

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
} as const;
