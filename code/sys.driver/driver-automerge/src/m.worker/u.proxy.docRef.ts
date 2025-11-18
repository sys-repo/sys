import { type t, Rx, notImpl, slug } from './common.ts';

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

  const onMessage = (event: MessageEvent) => {
    const msg = event.data as t.WireEvent | undefined;
    if (!msg || msg.type !== 'event' || msg.stream !== streamId) return;

    const payload = msg.event as t.WireDocEventPayload<T>;

    if (payload.type === 'doc/snapshot') {
      current = payload.payload.value as T;

      // Intentionally no `change$` event emission here:
      //    This is just the initial state hydrate.
      //    Consumers that care about the first "real" change
      //    subscribe to doc/change → synthesized CrdtChange<T>.
      //
      return;
    }

    if (payload.type === 'doc/change') {
      const next = payload.payload.value as T;
      const prev = current as T | undefined;

      // Update local snapshot.
      current = next;

      // Synthesize a minimal CrdtChange<T> for listeners.
      const change: t.CrdtChange<T> = {
        source: 'change',
        before: prev ?? next,
        after: next,
        // NB: Patches are intentionally empty – worker wire protocol
        // ships snapshot-only (no before/after deltas).
        // Patch-aware mode will be added behind an explicit opt-in later.
        patches: [],
      };

      change$.next(change);
      return;
    }

    if (payload.type === 'doc/deleted') {
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

      return Rx.toLifecycle<t.CrdtEvents<T>>(gate, {
        $,
        deleted$: deleted$.pipe(Rx.takeUntil(gate.dispose$)),
        path(path, opts = {}) {
          throw notImpl('[doc-proxy].events().path');
        },
      });
    },

    change(fn) {
      throw notImpl('[doc-proxy].change');
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
