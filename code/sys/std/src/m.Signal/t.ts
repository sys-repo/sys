import type { t } from './common.ts';
import type Preact from '@preact/signals-core';
import type { ReadonlySignal, Signal } from '@preact/signals-core';

export { ReadonlySignal, Signal };

/**
 * Utility type to extract the type of a signal value.
 * @example
 * ```ts
 * const mySignal = Signal.create<'Foo' | 'Bar'>('Foo');
 * type T = ExtractSignalValue<typeof mySignal>;
 * ```
 */
export type ExtractSignalValue<T> = T extends Signal<infer U> ? U : never;

/** Callback passed into a signal effect. */
export type SignalEffectFn = () => void | (() => void);

/**
 * Reactive Signals.
 * See:
 *    https://github.com/tc39/proposal-signals
 *    https://preactjs.com/blog/introducing-signals/
 *    https://preactjs.com/guide/v10/signals
 */
export type SignalLib = {
  readonly Is: SignalIsLib;

  /** Create a new plain signal. */
  create: typeof Preact.signal;

  /** Create an effect to run arbitrary code in response to signal changes. */
  effect: typeof Preact.effect;

  /** Combine multiple value updates into one "commit" at the end of the provided callback. */
  batch: typeof Preact.batch;

  /** Create a new signal that is computed based on the values of other signals. */
  computed: typeof Preact.computed;

  /** Create a new listeners collection. */
  listeners(dispose$?: t.UntilInput): t.SignalListeners;

  //
} & t.SignalValueHelpersLib;

/**
 * Utility helpers for operating on Signal values.
 */
export type SignalValueHelpersLib = {
  /** Toggle a boolean signal. */
  toggle(signal: Signal<boolean | undefined>, forceValue?: boolean): boolean;

  /** Cycle a union string signal through a list of possible values. */
  cycle<T>(signal: Signal<T | undefined>, values: T[], forceValue?: T): T;
};

/**
 * Helper for managing the disposal of a collection
 * of signal effect listeners.
 */
export type SignalListeners = t.Lifecycle & {
  readonly count: number;
  effect(fn: t.SignalEffectFn): SignalListeners;
};

/**
 * Flag helpers for working with Signals.
 */
export type SignalIsLib = {
  signal<T = unknown>(val: unknown): val is t.Signal<T>;
};
