import type { SignalReactLib } from './t.ts';

import { Std, useSignal } from './common.ts';
import { useSignalEffect as useEffect } from './u.useEffect.ts';
import { useSignalRedrawEffect as useRedrawEffect } from './u.useRedrawEffect.ts';

/**
 * Reactive Signals.
 * See:
 *    https://github.com/tc39/proposal-signals
 *    https://preactjs.com/blog/introducing-signals/
 *    https://preactjs.com/guide/v10/signals
 */
export const Signal: SignalReactLib = {
  ...Std,
  useSignal,
  useEffect,
  useRedrawEffect,
} as const;
