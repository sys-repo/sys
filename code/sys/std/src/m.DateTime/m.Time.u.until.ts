import type { t } from './common.ts';

import { Subject, take, takeUntil } from 'rxjs';
import { Dispose } from '../m.Dispose/mod.ts';
import { delay as baseDelay, Wrangle as DelayWrangle } from './m.Time.u.delay.ts';

/**
 * Exposes timer functions that cease after a
 * dispose signal is received.
 */
export function until(until$: t.UntilObservable) {
  let _disposed = false;
  const { dispose$ } = Dispose.disposable(until$);
  dispose$.subscribe(() => (_disposed = true));

  /**
   * API
   */
  const api: t.TimeUntil = {
    /**
     * A more useful (promise based) timeout function.
     */
    delay(...args: any[]): t.TimeDelayPromise {
      const { msecs, fn } = DelayWrangle.delayArgs(args);

      const done$ = new Subject<void>();
      const res = baseDelay(msecs, () => {
        done$.next();
        return fn?.();
      });
      dispose$.pipe(takeUntil(done$), take(1)).subscribe(() => res.cancel());
      return res;
    },

    /**
     * Lifecycle
     */
    dispose$,
    get disposed() {
      return _disposed;
    },
  } as const;

  return api;
}
