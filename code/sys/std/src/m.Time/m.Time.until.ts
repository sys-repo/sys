import { Dispose } from '../m.Dispose/mod.ts';

import { Rx, type t } from './common.ts';
import { delay, Wrangle } from './m.Time.delay.ts';
import { interval } from './m.Time.interval.ts';

/**
 * Exposes timer functions that cease after a dispose signal is received.
 */
export function until(until?: t.UntilInput) {
  const life = Dispose.lifecycle(until);

  const api: t.TimeUntil = {
    delay(...args: any[]): t.TimeDelayPromise {
      const { msecs, fn } = Wrangle.delayArgs(args);

      const done$ = Rx.subject<void>();
      const res = delay(msecs, () => {
        done$.next();
        return fn?.();
      });

      life.dispose$.pipe(Rx.takeUntil(done$), Rx.take(1)).subscribe(() => res.cancel());
      return res;
    },

    interval(msecs, fn, options) {
      const signal = wrangle.signal(options);
      const ctrl = new AbortController();
      const res = interval(msecs, fn, {
        signal: signal ? AbortSignal.any([ctrl.signal, signal]) : ctrl.signal,
        immediate: wrangle.immediate(options),
      });

      life.dispose$.pipe(Rx.take(1)).subscribe(() => ctrl.abort());
      return res;
    },

    wait(msecs) {
      return typeof msecs === 'number' ? api.delay(msecs) : api.delay();
    },

    /**
     * Lifecycle:
     */
    dispose: life.dispose,
    get dispose$() {
      return life.dispose$;
    },
    get disposed() {
      return life.disposed;
    },
  };

  return api;
}

const wrangle = {
  signal(input: unknown) {
    if (!input) return undefined;
    if (input instanceof AbortController) return input.signal;
    if (input instanceof AbortSignal) return input;
    if (typeof input !== 'object') return undefined;
    const signal = Reflect.get(input, 'signal');
    return signal instanceof AbortSignal ? signal : undefined;
  },

  immediate(input: unknown) {
    if (!input || typeof input !== 'object') return false;
    return (input as t.TimeIntervalOptions).immediate === true;
  },
} as const;
