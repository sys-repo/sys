import type Preact from '@preact/signals-core';
import type { t } from './common.ts';

export type * from './t.walk.ts';

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
   * Convert any mix of values, arrays, and `Signal`s into a plain,
   * JSON-safe snapshot.
   *
   * - Replaces each `Signal<X>` with its current `.value`.
   * - Traverses arrays and plain objects recursively.
   * - Skips accessors by default (avoids invoking getters).
   * - Guards against cycles and deep recursion.
   *
   * Intended for debug/inspection: produces a safe, non-reentrant
   * structure suitable for logging or UI tree viewers.
   */
  toObject<T>(input: T, opts?: t.SignalToObjectOptions): t.UnwrapSignals<T>;

  /**
   * Walks an object tree (recursive descent) and invokes `fn` for each Signal found.
   * Returns the number of visited signals.
   */
  walk: t.SignalWalk;
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

/** Options to control how aggressively `Signal.toObject` dehydrates. */
export type SignalToObjectOptions = {
  /** Max recursion depth (to avoid huge graphs / cycles). */
  depth?: number;
  /** Include accessor (getter) properties. Default: false (skip). */
  includeGetters?: boolean;
};
