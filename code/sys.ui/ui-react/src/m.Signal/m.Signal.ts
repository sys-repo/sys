import { effect, signal, useSignal, useSignalEffect } from '@preact/signals-react';
import type { t } from './common.ts';

/**
 * Reactive Signals.
 * Docs (via `preact/signals`): https://preactjs.com/guide/v10/signals
 */
export const Signal: t.SignalReactLib = {
  signal,
  effect,
  useSignal,
  useSignalEffect,
} as const;
