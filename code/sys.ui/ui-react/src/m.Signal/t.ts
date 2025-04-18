import type Preact from '@preact/signals-react';
import type { SignalLib } from '@sys/std/t';

export type { ExtractSignalValue, ReadonlySignal, Signal } from '@sys/std/t';

/**
 * Reactive Signals.
 * See:
 *    https://github.com/tc39/proposal-signals
 *    https://preactjs.com/blog/introducing-signals/
 *    https://preactjs.com/guide/v10/signals
 */
export type SignalReactLib = SignalLib & {
  useSignal: typeof Preact.useSignal;
  useEffect: typeof Preact.useSignalEffect;

  /**
   * Safely causes a redraw (via a useState counter incrementing)
   * when any of the signals that are hooked into within the
   * callback change value.
   *
   *    Safe: == stops effect listeners on tear-down.
   *
   */
  useRedrawEffect(cb: () => void): void;
};
