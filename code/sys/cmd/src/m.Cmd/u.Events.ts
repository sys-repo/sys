import { R, rx, type t, type u } from './common.ts';
import { Patch } from './u.Patch.ts';
import { Path } from './u.Path.ts';

/**
 * Strongly typed events for an abstract CRDT document that has
 * paths within it representing a <Cmd> (Command).
 */
export const Events: t.CmdEventsLib = {
  /**
   * Events factory.
   */
  create<C extends t.CmdType>(
    doc?: t.CmdTransport,
    options: t.CmdEventsOptions = {},
  ): t.CmdEvents<C> {
    const resolve = Path.resolver(options.paths);
    const paths = resolve.paths;
    const life = rx.lifecycle(options.dispose$);
    const { dispose, dispose$ } = life;

    const issuers = wrangle.issuers(options.issuer);
    const issuersFilter = (e: t.CmdTx<C>) => {
      if (issuers.length === 0) return true; // NB: no {issuer} constraint.
      return e.issuer ? issuers.includes(e.issuer) : false;
    };

    /**
     * Observables.
     */
    const fire = (e: t.CmdEvent) => fire$.next(e);
    const fire$ = rx.subject<t.CmdEvent>();
    const $ = fire$.pipe(rx.takeUntil(dispose$));
    const tx$ = rx.payload<t.CmdTxEvent<C>>($, 'sys.cmd/tx').pipe(rx.filter(issuersFilter));
    const error$ = tx$.pipe(rx.filter((e) => !!e.error));

    if (doc) {
      const events = doc.events(dispose$);
      const $ = events.changed$.pipe(
        rx.map((e) => {
          const { patches, after } = e;
          const doc = resolve.toObject(after);
          return { patches, doc };
        }),
      );

      // Tx (Command) ⚡️.
      let _lastProcessed = '';
      $.pipe(
        rx.filter((e) => Patch.includesQueueChange(e.patches, paths)),
        rx.distinctWhile((p, n) => p.doc.queue.length === n.doc.queue.length),
        rx.filter((e) => e.doc.queue.length > 0),
      ).subscribe((e) => {
        /**
         * NOTE: on each change a new batch of events is fired running
         *       back to the last Tx that was processed.
         *       This is required as the CRDT might update itself unevently
         *       (for instance, when a batch of changes is synced over the network)
         *       and so this looks to the [queue] array itself as the source of
         *       truth (not this change event) and fires accordingly.
         */
        const queue = e.doc.queue ?? [];
        const list = Events.unprocessed(queue, _lastProcessed);
        _lastProcessed = queue[queue.length - 1].id || '';
        list.forEach((e) => {
          const { name, params, error, tx, id, issuer } = e;
          fire({
            type: 'sys.cmd/tx',
            payload: { name, params, error, tx, id, issuer },
          });
        });
      });
    }

    /**
     * API
     */
    const api: t.CmdEvents<C> = {
      $,
      tx$,
      error$,

      on<N extends C['name']>(name: N, handler?: t.CmdEventsOnMethodHandler<u.CmdTypeMap<C>[N]>) {
        type M = u.CmdTypeMap<C>[N];
        type T = t.CmdTx<M>;
        const res$ = api.tx$.pipe(rx.filter((e) => e.name === name)) as t.Observable<T>;
        if (handler) res$.subscribe((e) => handler(e));
        return res$;
      },

      issuer(input) {
        type R = ReturnType<t.CmdEvents<C>['issuer']>;
        const issuer = [...issuers, ...wrangle.issuers(input)];
        const res = Events.create(doc, { ...options, issuer, dispose$ });
        delete (res as any).dispose;
        return res as unknown as R;
      },

      // Lifecycle.
      dispose,
      dispose$,
      get disposed() {
        return life.disposed;
      },
    };
    return api;
  },

  /**
   * Scan back in a queue and find the given <last> item and
   * return the set from that point on.
   */
  unprocessed(queue: t.CmdQueue, lastProcessed: string): t.CmdQueue {
    if (queue.length === 0) return [];
    if (!lastProcessed) return [queue[queue.length - 1]].filter(Boolean);
    const index = queue.findLastIndex((m) => m.id === lastProcessed);
    return index < 0 ? queue : queue.slice(index + 1);
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  issuers(input?: t.StringId | t.StringId[]): t.StringId[] {
    if (!input) return [];
    return R.uniq((Array.isArray(input) ? input : [input]).filter(Boolean));
  },
} as const;
