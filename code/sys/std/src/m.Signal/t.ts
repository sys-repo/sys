import type Preact from '@preact/signals-core';
export type { ReadonlySignal, Signal } from '@preact/signals-core';

/**
 * Reactive Signals.
 * Docs (via `preact/signals`): https://preactjs.com/guide/v10/signals
 */
export type SignalLib = {
  create: typeof Preact.signal;
  effect: typeof Preact.effect;
};
