import { rx, type t } from './common.ts';
import { handlerOn } from './m.Keyboard.Monitor.ts';

/**
 * A "multi event" monitor scoped to 2-keypresses.
 */
export function dbl(threshold = 500, options: { dispose$?: t.UntilInput } = {}) {
  const life = rx.lifecycle(options.dispose$);
  const { dispose, dispose$ } = life;

  const api: t.KeyboardMonitorMulti = {
    on(pattern, fn) {
      type E = t.KeyMatchSubscriberHandlerArgs;
      const $ = rx.subject<E>();

      let monitor: t.TimeThreshold<E> | undefined;
      const killMonitor = () => {
        monitor?.dispose();
        monitor = undefined;
      };

      const next = (e: E) => {
        if (!monitor) {
          monitor = rx.withinTimeThreshold($, threshold, { dispose$ });
          monitor.timeout$.subscribe(killMonitor);
          monitor.$.subscribe((e) => {
            fn(e);
            killMonitor();
          });
        }
        $.next(e);
      };

      return handlerOn(pattern, (e) => next(e), { dispose$ });
    },

    dispose,
    dispose$,
    get disposed() {
      return life.disposed;
    },
  };

  return api;
}
