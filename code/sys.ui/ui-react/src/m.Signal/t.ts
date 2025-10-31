import type Preact from '@preact/signals-react';
import type { SignalLib } from '@sys/std/t';
import type { t } from './common.ts';

export type { ReadonlySignal, Signal, SignalValue, UnwrapSignals } from '@sys/std/t';
export type * from './t.effect.ts';

/**
 * Reactive Signals (React Extensions)
 */
export type SignalReactLib = SignalLib & {
  /**
   * React hook: create a reactive Signal bound to component render lifecycle.
   *
   * Example:
   * ```ts
   * const count = Signal.useSignal(0);
   * Signal.useEffect(() => console.log(count.value));
   * ```
   *
   * Mirrors `@preact/signals-react` behavior:
   * - Reading `.value` inside an effect registers a dependency.
   * - Updating `.value` triggers re-render and dependent effects.
   */
  useSignal: typeof Preact.useSignal;

  /**
   * Register a lifecycle-aware reactive effect.
   *
   * Wraps `useSignalEffect` from `@preact/signals-react`, adding a lazily-instantiated
   * `Abortable` lifecycle (`e.life`) for each run.
   *
   * Key behaviors:
   * - `e.life` is only created if accessed.
   * - Cleans up in order: user cleanup → `life.dispose()` (if created).
   * - Each run receives a fresh lifecycle; previous is disposed first.
   *
   * Example:
   * ```ts
   * Signal.useEffect((e) => {
   *   count.value; // establish dependency
   *   e.life.dispose$.subscribe(() => console.log('cleanup'));
   * });
   * ```
   */
  useEffect: t.UseSignalEffectListener;

  /**
   * Safely causes a redraw (via a useState counter incrementing)
   * when any of the signals that are hooked into within the
   * callback change value.
   *
   *    Safe: == stops effect listeners on tear-down.
   *
   */
  useRedrawEffect: t.UseRedrawEffectListener;
};
