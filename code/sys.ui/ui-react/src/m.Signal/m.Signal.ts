import { useSignal, useSignalEffect } from '@preact/signals-react';
import { Signal as Std } from '@sys/std/signal';
import type { t } from './common.ts';

/**
 * Reactive Signals.
 * See:
 *    https://github.com/tc39/proposal-signals
 *    https://preactjs.com/blog/introducing-signals/
 *    https://preactjs.com/guide/v10/signals
 */
export const Signal: t.SignalReactLib = {
  ...Std,
  useSignal,
  useSignalEffect,
} as const;
