import { effect as preactEffect } from '@preact/signals-core';
import { type t, Rx, Try } from './common.ts';

export const effect = preactEffect;

/**
 * Lifecycle-aware wrapper around Preact's `effect`.
 * - Creates a fresh Abortable per run.
 * - Invokes user cleanup, then aborts the run's lifecycle on re-run/teardown.
 * - External disposer also aborts the currently active run.
 */
export const effectL: t.SignalEffectListener = (fn, opts = {}) => {
  let current: t.Abortable | undefined;

  const stop = preactEffect(() => {
    // Fresh lifecycle for this run.
    const life = Rx.abortable();
    current = life;

    const cleanup = fn(life);

    // Cleanup for this run (before next run or on final dispose).
    return () => {
      if (typeof cleanup === 'function') Try.catch(cleanup);

      // Abort/Dispose this run's lifecycle:
      if (!life.disposed) Try.catch(life.dispose);

      // Finally:
      if (current === life) current = undefined;
    };
  }, opts);

  // External disposer for the whole effect:
  return () => {
    Try.catch(stop);
    // Cleanup:
    const last = current;
    current = undefined;
    if (last && !last.signal.aborted) last.dispose();
  };
};
