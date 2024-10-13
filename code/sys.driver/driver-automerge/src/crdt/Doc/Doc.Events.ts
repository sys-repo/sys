import { rx, type t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Generate a new events wrapper for the given handle.
 */
export function eventsFactory<T extends O>(
  doc: t.DocWithHandle<T>,
  options: { dispose$?: t.UntilObservable } = {},
) {
  type E = t.DocEvents<T>;
  const handle = doc.handle;
  const uri = handle.url;

  const life = rx.lifecycle(options.dispose$);
  const { dispose, dispose$ } = life;
  dispose$.subscribe(() => {
    unlisten();
    fire$?.complete();
  });

  const fire$ = rx.subject<t.DocEvent<T>>();
  const $ = fire$.pipe(rx.takeUntil(dispose$));
  const fire = (e: t.DocEvent<T>) => fire$.next(e);

  const ephemeral: E['ephemeral'] = {
    out$: rx.payload<t.DocEphemeralOutEvent<T>>($, 'crdt:doc/Ephemeral:out'),
    in$: rx.payload<t.DocEphemeralInEvent<T>>($, 'crdt:doc/Ephemeral:in'),
    in<M extends t.CBOR>(filter?: t.DocEphemeralFilter<T, M>) {
      type O = t.Observable<t.DocEphemeralIn<T, M>>;
      function monad(
        ob$: t.Observable<t.DocEphemeralIn<T, M>>,
        fn?: t.DocEphemeralFilter<T, M>,
      ): t.DocEphemeralFilterMonad<T, M> {
        const $ = fn ? ob$.pipe(rx.filter(fn)) : ob$;
        return { $, filter: (fn) => monad($, fn), subscribe: (fn) => $.subscribe(fn) };
      }
      return monad(ephemeral.in$ as O, filter);
    },
  };

  /**
   * Handlers.
   */
  const onChange = (e: t.DocHandleChangePayload<T>) => {
    const { patches } = e;
    const { before, after, source } = e.patchInfo;
    fire({
      type: 'crdt:doc/Changed',
      payload: { uri, source, before, after, patches },
    });
  };

  const onDelete = (_e: t.DocHandleDeletePayload<T>) => {
    fire({
      type: 'crdt:doc/Deleted',
      payload: { uri, doc: doc.current },
    });
  };

  const onEphemeralInbound = (e: t.DocHandleEphemeralMessagePayload<T>) => {
    const payload: t.DocEphemeralIn<T> = {
      direction: 'incoming',
      doc,
      sender: { id: e.senderId },
      message: e.message as t.CBOR,
    };
    fire({ type: 'crdt:doc/Ephemeral:in', payload });
  };

  const onEphemeralOutbound = (e: t.DocHandleOutboundEphemeralMessagePayload<T>) => {
    const data = e.data;
    const payload: t.DocEphemeralOut<T> = { direction: 'outgoing', doc, data };
    fire({ type: 'crdt:doc/Ephemeral:out', payload });
  };

  /**
   * Listen.
   */
  handle.on('change', onChange);
  handle.on('delete', onDelete);
  handle.on('ephemeral-message', onEphemeralInbound);
  handle.on('ephemeral-message-outbound', onEphemeralOutbound);
  const unlisten = () => {
    handle.off('change', onChange);
    handle.off('delete', onDelete);
    handle.off('ephemeral-message', onEphemeralInbound);
    handle.off('ephemeral-message-outbound', onEphemeralOutbound);
  };

  /**
   * API
   */
  const api: E = {
    $,
    changed$: rx.payload<t.DocChangedEvent<T>>($, 'crdt:doc/Changed'),
    deleted$: rx.payload<t.DocDeletedEvent<T>>($, 'crdt:doc/Deleted'),
    ephemeral,

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
