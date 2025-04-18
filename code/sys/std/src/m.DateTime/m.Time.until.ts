import type { t } from './common.ts';

import { Subject, take, takeUntil } from 'rxjs';
import { Dispose } from '../m.Dispose/mod.ts';
import { delay, Wrangle } from './m.Time.delay.ts';

/**
 * Exposes timer functions that cease after a dispose signal is received.
 */
export function until(until$: t.UntilObservable) {
  const life = Dispose.lifecycle(until$);

  const api: t.TimeUntil = {
    delay(...args: any[]): t.TimeDelayPromise {
      const { msecs, fn } = Wrangle.delayArgs(args);

      const done$ = new Subject<void>();
      const res = delay(msecs, () => {
        done$.next();
        return fn?.();
      });

      life.dispose$.pipe(takeUntil(done$), take(1)).subscribe(() => res.cancel());
      return res;
    },

    wait(msecs) {
      return typeof msecs === 'number' ? api.delay(msecs) : api.delay();
    },

    /**
     * Lifecycle
     */
    dispose: life.dispose,
    get dispose$() {
      return life.dispose$;
    },
    get disposed() {
      return life.disposed;
    },
  } as const;

  return api;
}
