import type { t } from './common.ts';
import type Preact from '@preact/signals-react';

/**
 * Reactive Signals.
 * Docs (via `preact/signals`): https://preactjs.com/guide/v10/signals
 */
export type SignalReactLib = {
  signal: typeof Preact.signal;
  effect: typeof Preact.effect;
  useSignal: typeof Preact.useSignal;
  useSignalEffect: typeof Preact.useSignalEffect;
};
