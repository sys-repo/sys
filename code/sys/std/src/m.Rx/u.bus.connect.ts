import type { t } from '../common.ts';
import { Dispose } from '../m.Dispose/mod.ts';
import { delay, filter, takeUntil } from './u.Rx.libs.ts';

/**
 * Setup a two-way connection between two or more event-buses.
 */
export function connect<E extends t.Event>(
  buses: t.EventBus<any>[],
  options: t.BusConnectOptions = {},
): t.BusConnection<E> {
  if (buses.length < 2) {
    throw new Error('Must have at least two event-buses to setup connection.');
  }

  const { async = true } = options;
  const { dispose, dispose$ } = Dispose.disposable(options.dispose$);

  let _isDisposed = false;
  dispose$.subscribe(() => (_isDisposed = true));

  const ignore = new Set<E>();
  const fire = (bus: t.EventBus<E>, event: E) => {
    if (_isDisposed) return;
    ignore.add(event);
    bus.fire(event);
    ignore.delete(event);
  };

  buses.forEach((source) => {
    let $ = source.$.pipe(
      takeUntil(dispose$),
      filter((e) => !ignore.has(e)),
    );

    if (async) $ = $.pipe(delay(0));

    $.subscribe((e) => {
      buses
        .filter((target) => target !== source) // <== (bus): not self.
        .forEach((bus) => fire(bus, e));
    });
  });

  return {
    buses,
    dispose,
    dispose$,
    get isDisposed() {
      return _isDisposed;
    },
  };
}
