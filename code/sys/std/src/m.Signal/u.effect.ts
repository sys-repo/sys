import { effect as preactEffect } from '@preact/signals-core';
import { type t, Rx, Try } from './common.ts';

/**
 * Lifecycle-aware wrapper around Preact's `effect`.
 * - Lazily creates an Abortable per run on first `e.life` access.
 * - Invokes user cleanup, then aborts the run's lifecycle on re-run/teardown.
 * - External disposer also aborts the currently active run (if created).
 */
export const effect: t.SignalEffectListener = (fn, opts = {}) => {
  let current: t.Abortable | undefined;

  /**
   * Disposer returned by Preact's `effect`.
   * Stops the reactive subscription and runs cleanup.
   */
  const stop = preactEffect(() => {
    let life: t.Abortable | undefined;

    const e: t.SignalEffectFnArgs = {
      get life() {
        if (!life) {
          life = Rx.abortable();
          current = life;
        }
        return life;
      },

      await(fn) {
        const run = e.life;

        void (async () => {
          try {
            await fn();
          } catch (err) {
            // Suppress any errors after run disposal/abort.
            if (run.disposed || run.signal.aborted) return;

            // Surface asynchronously (global), but outside this promise chain.
            queueMicrotask(() => {
              throw err;
            });
          }
        })();
      },
    };

    const cleanup = fn(e);

    // Cleanup for this run (before next run or on final dispose).
    return () => {
      if (typeof cleanup === 'function') Try.run(cleanup);

      // Abort/Dispose this run's lifecycle (only if created):
      if (life && !life.disposed) Try.run(life.dispose);

      // Finally:
      if (current === life) current = undefined;
    };
  }, opts);

  /**
   * External disposer for the whole effect:
   */
  return () => {
    Try.run(stop);
    // Cleanup (only if a `lifecycle` was ever created for the current run):
    const last = current;
    current = undefined;
    if (last && !last.disposed) last.dispose();
  };
};
