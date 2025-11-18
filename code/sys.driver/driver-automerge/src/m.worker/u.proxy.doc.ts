import { type t, Immutable, Rx, slug } from './common.ts';
import { changePatches } from './u.proxy.doc.change.ts';
import { Wire } from './u.wire.ts';

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

  const ensureCurrent = () => {
    if (current !== undefined) return current;
    throw new Error(`Crdt.Worker.ProxyDoc.current("${id}") used before first snapshot`);
  };

  const api: t.CrdtDocWorkerProxy<T> = {
    id,
    via: 'worker-proxy',
    instance: slug(),

    get current() {
      return ensureCurrent();
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
      if (life.disposed) return;

      const before = ensureCurrent();
      const changed = changePatches<T>(fn, before);
      const after = changed.after;

      // Convert Automerge patches to simple wire-patch shape.
      const wirePatches = changed.patches.map((patch) => {
        const path = (patch.path ?? []) as t.ObjectPath;
        return { path } satisfies t.WirePatch;
      });

      // 1) Optimistic local state + event (proxy-origin).
      current = after;
      const patches = wirePatches.map((p) => p as t.CrdtPatch);
      change$.next({ source: 'change', before, after, patches });

      /**
       * TODO: expand `source` → sys-level origin enum
       * (workerProxy / workerRepo / workerSync / workerLoad).
       */

      // 2) Ship intent to the worker as a doc-level wire event.
      const stream = Wire.Kind.doc(id);
      const event: t.WireDocEventPayload<T> = {
        type: 'doc/change',
        payload: { id, value: after, patches: wirePatches },
      };

      port.postMessage(Wire.event(stream, event));
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

  port.addEventListener?.('message', onMessage, { signal: life.signal });
  life.dispose$.subscribe(() => {});

  return api;
}
