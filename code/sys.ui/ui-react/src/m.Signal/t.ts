import type Preact from '@preact/signals-react';
import type { SignalLib } from '@sys/std/t';

export type { ReadonlySignal, Signal } from '@preact/signals-react';

/**
 * Reactive Signals.
 * See:
 *    https://github.com/tc39/proposal-signals
 *    https://preactjs.com/blog/introducing-signals/
 *    https://preactjs.com/guide/v10/signals
 */
export type SignalReactLib = SignalLib & {
  useSignal: typeof Preact.useSignal;
  useSignalEffect: typeof Preact.useSignalEffect;

  /**
   * Causes a redraw (via a useState counter incrementing)
   * when any of the signals that are hooked into within the
   * callback change value.
   */
  useRedrawEffect(cb: () => void): void;
};
