import { Rx, type t } from './common.ts';
import { handlerFiltered, handlerOnOverloaded, KeyboardMonitor } from './m.Keyboard.Monitor.ts';
import { dbl } from './m.Keyboard.dbl.ts';

/**
 * Exposes keyboard functions that cease after a
 * dispose signal is received.
 */
export function until(until?: t.UntilInput): t.KeyboardEventsUntil {
  const life = Rx.lifecycle(until);
  const { dispose, dispose$ } = life;

  const on: t.KeyboardMonitor['on'] = (...args: any) =>
    handlerOnOverloaded(args, { until: dispose$ });
  const filter: t.KeyboardMonitor['filter'] = (fn) => handlerFiltered(fn, { until: dispose$ });

  const $ = KeyboardMonitor.$.pipe(Rx.takeUntil(dispose$));
  const down$ = $.pipe(Rx.filter((e) => e.last?.stage === 'Down'));
  const up$ = $.pipe(Rx.filter((e) => e.last?.stage === 'Up'));

  const api: t.KeyboardEventsUntil = {
    $,
    up$,
    down$,
    filter,
    on,

    dbl(threshold?: t.Msecs) {
      return dbl(threshold, { until: dispose$ });
    },

    dispose,
    dispose$,
    get disposed() {
      return life.disposed;
    },
  };
  return api;
}
