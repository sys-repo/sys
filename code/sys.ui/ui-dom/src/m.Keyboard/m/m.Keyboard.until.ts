import { Rx, type t } from '../common.ts';
import { handlerFiltered, handlerOnOverloaded, KeyboardMonitor } from './m.Keyboard.Monitor.ts';
import { dbl } from './m.Keyboard.dbl.ts';

/**
 * Exposes keyboard functions that cease after a
 * dispose signal is received.
 */
export function until(until?: t.UntilInput): t.Keyboard.EventsUntil {
  const life = Rx.lifecycle(until);

  const on: t.Keyboard.Monitor.Lib['on'] = (...args: any) =>
    handlerOnOverloaded(args, { until: life.dispose$ });
  const filter: t.Keyboard.Monitor.Lib['filter'] = (fn) =>
    handlerFiltered(fn, { until: life.dispose$ });

  const $ = KeyboardMonitor.$.pipe(Rx.takeUntil(life.dispose$));
  const down$ = $.pipe(Rx.filter((e) => e.last?.stage === 'Down'));
  const up$ = $.pipe(Rx.filter((e) => e.last?.stage === 'Up'));

  const api: t.Keyboard.EventsUntil = {
    $,
    up$,
    down$,
    filter,
    on,

    dbl(threshold?: t.Msecs) {
      return dbl(threshold, { until: life.dispose$ });
    },

    dispose: life.dispose,
    [Symbol.dispose]: life[Symbol.dispose],
    dispose$: life.dispose$,
    get disposed() {
      return life.disposed;
    },
  };
  return api;
}
