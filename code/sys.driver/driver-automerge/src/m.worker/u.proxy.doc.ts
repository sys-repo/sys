import { type t, Immutable, Rx, notImpl, slug } from './common.ts';

type O = Record<string, unknown>;

export function createDocProxy<T extends O = O>(
  id: t.StringId,
  port: MessagePort,
  until?: t.UntilInput,
): t.CrdtDocWorkerProxy<T> {
  const life = Rx.abortable(until);
  const streamId: t.WireStream = `crdt:doc:${id}`;

  /**
   * State:
   */
  let current: T | undefined;
  let deleted = false;

  /**
   * Events:
   */
  const change$ = Rx.subject<t.CrdtChange<T>>();
  const deleted$ = Rx.subject<t.CrdtDeleted>();

  const onMessage = (ev: MessageEvent) => {
    const msg = ev.data as t.WireEvent | undefined;
    if (!msg || msg.type !== 'event' || msg.stream !== streamId) return;

    const event = msg.event as t.WireDocEventPayload<T>;

    if (event.type === 'doc/snapshot') {
      current = event.payload.value as T;
      /**
       * Intentionally no `change$` event emission here:
       *    This is just the initial state hydrate.
       *    Consumers that care about the first "real" change
       *    subscribe to doc/change → synthesized CrdtChange<T>.
       */
      return;
    }

    if (event.type === 'doc/change') {
      const next = event.payload.value as T;
      const prev = current as T | undefined;
      const patches = event.payload.patches ?? [];

      // Update local snapshot.
      current = next;

      // Synthesize a minimal CrdtChange<T> for listeners.
      const change: t.CrdtChange<T> = {
        source: 'change',
        before: prev ?? next,
        after: next,
        /**
         * NB:
         * These patches contain *only* object-paths extracted from the
         * worker wire payload. They do NOT include values or operations.
         *
         * Rationale:
         * - Keep the worker protocol lightweight (snapshot + paths).
         * - Enable path-based filtering (`events().path(...)`) on the proxy.
         * - Full Automerge-style patches remain a future explicit opt-in.
         */
        patches: patches as t.CrdtPatch[],
      };

      change$.next(change);
      return;
    }

    if (event.type === 'doc/deleted') {
      deleted = true;
      deleted$.next({ id });
      return;
    }
  };

  const api: t.CrdtDocWorkerProxy<T> = {
    id,
    via: 'worker-proxy',
    instance: slug(),

    get current() {
      if (current === undefined) {
        const err = `CrdtDocWorkerProxy.current("${id}") used before first snapshot`;
        throw new Error(err);
      }
      return current;
    },

    get deleted() {
      return deleted;
    },

    events(untilInput) {
      const gate = Rx.lifecycle([life, untilInput]);
      const $ = change$.pipe(Rx.takeUntil(gate.dispose$));
      const path = Immutable.Events.pathFilter<T, t.CrdtPatch, t.CrdtChange<T>>(
        $,
        (patch) => patch.path,
      );

      return Rx.toLifecycle<t.CrdtEvents<T>>(gate, {
        $,
        deleted$: deleted$.pipe(Rx.takeUntil(gate.dispose$)),
        path,
      });
    },

    change(fn) {
      throw notImpl('Document is readonly');
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

  life.dispose$.subscribe(() => {
    // TODO: 🌸 detach listeners / any extra cleanup if needed.
  });

  port.addEventListener?.('message', onMessage, { signal: life.signal });
  return api;
}
