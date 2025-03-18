import type Preact from '@preact/signals-core';
import type { ReadonlySignal, Signal } from '@preact/signals-core';

export { ReadonlySignal, Signal };

/**
 * Reactive Signals.
 * See:
 *    https://github.com/tc39/proposal-signals
 *    https://preactjs.com/blog/introducing-signals/
 *    https://preactjs.com/guide/v10/signals
 */
export type SignalLib = {
  /** Create a new plain signal. */
  create: typeof Preact.signal;

  /** Create an effect to run arbitrary code in response to signal changes. */
  effect: typeof Preact.effect;

  /** Combine multiple value updates into one "commit" at the end of the provided callback. */
  batch: typeof Preact.batch;

  /** Create a new signal that is computed based on the values of other signals. */
  computed: typeof Preact.computed;

  //
} & SignalValueHelpersLib;

/**
 * Utility helpers for operating on Signal values.
 */
export type SignalValueHelpersLib = {
  /** Toggle a boolean signal. */
  toggle(signal: Signal<boolean>, forceValue?: boolean): boolean;

  /** Cycle a union string signal through a list of possible values. */
  cycle<T extends string | number>(signal: { value: T }, values: T[], forceValue?: T): T;
};
