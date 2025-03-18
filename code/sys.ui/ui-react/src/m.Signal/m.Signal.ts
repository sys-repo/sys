import { type t, Std, useSignalEffect as useEffect, useSignal } from './common.ts';
import { useRedrawEffect } from './u.useRedrawEffect.ts';

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
  useEffect,
  useRedrawEffect,
} as const;
