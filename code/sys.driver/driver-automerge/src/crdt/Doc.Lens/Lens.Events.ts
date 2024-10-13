import { rx, type t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Generate a new events wrapper for the given handle.
 */
export function eventsFactory<L extends O>(
  source$: t.Observable<t.LensEvent<L>>,
  options: { dispose$?: t.UntilObservable } = {},
) {
  const life = rx.lifecycle(options.dispose$);
  const { dispose, dispose$ } = life;
  const $ = source$.pipe(rx.takeUntil(dispose$));

  const api: t.LensEvents<L> = {
    $,
    changed$: rx.payload<t.LensChangedEvent<L>>($, 'crdt:lens/Changed'),
    deleted$: rx.payload<t.LensDeletedEvent<L>>($, 'crdt:lens/Deleted'),

    /**
     * Lifecycle
     */
    dispose,
    dispose$,
    get disposed() {
      return life.disposed;
    },
  };

  return api;
}
