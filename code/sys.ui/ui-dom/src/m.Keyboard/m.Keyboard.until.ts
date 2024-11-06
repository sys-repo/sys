import { rx, type t } from './common.ts';
import { KeyboardMonitor, handlerFiltered, handlerOnOverloaded } from './m.Keyboard.Monitor.ts';
import { dbl } from './m.Keyboard.dbl.ts';

/**
 * Exposes keyboard functions that cease after a
 * dispose signal is received.
 */
export function until(until$?: t.UntilObservable): t.KeyboardEventsUntil {
  const life = rx.lifecycle(until$);
  const { dispose, dispose$ } = life;

  const on: t.KeyboardMonitor['on'] = (...args: any) => handlerOnOverloaded(args, { dispose$ });
  const filter: t.KeyboardMonitor['filter'] = (fn) => handlerFiltered(fn, { dispose$ });

  const $ = KeyboardMonitor.$.pipe(rx.takeUntil(dispose$));
  const down$ = $.pipe(rx.filter((e) => e.last?.stage === 'Down'));
  const up$ = $.pipe(rx.filter((e) => e.last?.stage === 'Up'));

  const api: t.KeyboardEventsUntil = {
    $,
    up$,
    down$,
    filter,
    on,

    dbl(threshold?: t.Msecs) {
      return dbl(threshold, { dispose$ });
    },

    dispose,
    dispose$,
    get disposed() {
      return life.disposed;
    },
  };
  return api;
}
