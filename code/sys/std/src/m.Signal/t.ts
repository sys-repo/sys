import type Preact from '@preact/signals-core';
import type { t } from './common.ts';

type O = Record<string, unknown>;

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

  /** Hooks into signal(s) value property. */
  listen(subject?: t.Signal | Array<unknown> | O, deep?: boolean): void;

  /**
   * Recursively converts an object/array of `Signal`s into
   * a plain JSON‑safe structure by replacing every `signal` with
   * its current `.value`.
   *
   * @param input  Any value: primitives, arrays, objects, Signals, or a mix.
   * @returns      The same structure with every `Signal<X>` replaced by `X`.
   */
  toObject<T>(input: T): t.UnwrapSignals<T>;

  //
} & t.SignalValueHelpersLib;

/**
 * Utility helpers for operating on Signal values.
 */
export type SignalValueHelpersLib = {
  /** Toggle a boolean signal. */
  toggle(signal: t.Signal<boolean | number | undefined>, forceValue?: boolean): boolean;

  /** Cycle a union string signal through a list of possible values. */
  cycle<T>(signal: t.Signal<T | undefined>, values: T[], forceValue?: T): T;
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
