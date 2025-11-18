import { type t, Rx } from './common.ts';
import { Wire } from './u.wire.ts';

type O = Record<string, unknown>;

/**
 * Host-side wiring: mirror a real CrdtRef<T> over the wire as `crdt:doc:<id>`.
 *
 * NOTE:
 * - One instance per doc id (we can ref-count later if needed).
 * - Emits:
 *   - doc/snapshot   (initial current value)
 *   - doc/change     (after + deleted flag)
 *   - doc/deleted    (terminal marker)
 */
export function attachDoc<T extends O = O>(
  port: MessagePort,
  doc: t.CrdtRef<T>,
  until?: t.UntilInput,
): t.Lifecycle {
  const life = Rx.abortable(until);
  const stream = Wire.Kind.doc(doc.id);

  /**
   * Emit initial snapshot so the proxy can populate `current`.
   */
  const emitSnapshot = () => {
    const msg: t.WireDocEventPayload<T> = {
      type: 'doc/snapshot',
      payload: { id: doc.id, value: doc.current },
    };
    const payload = Wire.event(stream, msg);
    port.postMessage(payload);
  };

  emitSnapshot();

  /**
   * Subscribe to doc events and mirror them to wire.
   */
  const ev = doc.events(life.dispose$);
  ev.$.subscribe((e) => {
    /**
     * Forward normalized doc changes over the wire.
     * Send only the minimal wire-transport version of patches.
     * The key information is what `path` was involved in each patch.
     */
    const patches = e.patches.map(({ path }) => ({ path }));
    const msg: t.WireDocEventPayload<T> = {
      type: 'doc/change',
      payload: { id: doc.id, value: e.after, patches },
    };
    port.postMessage(Wire.event(stream, msg));
  });

  ev.deleted$.subscribe((e) => {
    const msg: t.WireDocEventPayload<T> = { type: 'doc/deleted', payload: { id: doc.id } };
    port.postMessage(Wire.event(stream, msg));
  });

  /**
   * Inbound handler: apply proxy-origin `doc/change` events back into
   * the real CrdtRef<T> hosted inside this worker.
   *
   * ⚠️ WARNING (2025-11):
   * This path currently performs a *structural overwrite* based on
   * `payload.value` (the proxy’s post-change snapshot). It does **not**
   * replay real Automerge operations such as:
   *
   *   • A.splice / text inserts / deletions
   *   • mark add/remove ops
   *   • list/seq targeted mutations
   *   • incremental map/set operations
   *
   * Meaning:
   * - These changes are faithfully reproduced as final state, but they
   *   are *not* applied as CRDT operations inside the real document.
   * - This is sufficient for functional correctness, but it discards
   *   the semantic intent of advanced text operations.
   *
   * FUTURE:
   * - We will lift this to an op-driven protocol:
   *     proxy:   derive intent → send typed doc/op commands
   *     worker:  replay real Automerge ops (A.splice, mark, list ops, etc)
   * - Until that lands, consider this a *safe fallback* implementation,
   *   not the final transport for text-level or mark-level editing.
   */
  const onMessage = (event: MessageEvent) => {
    const msg = event.data as t.WireMessage | undefined;
    if (!msg || msg.type !== 'event') return;
    if (msg.stream !== stream) return;

    const wire = msg.event as t.WireDocEventPayload<T>;
    if (wire.type !== 'doc/change') return;

    const { value } = wire.payload;

    // Apply the new value to the real Automerge-backed document.
    void doc.change((draft: T) => {
      const dst = draft as any;
      const src = value as any;

      // Remove keys that no longer exist:
      for (const key of Object.keys(dst)) {
        if (!(key in src)) delete dst[key];
      }

      // Assign incoming keys:
      for (const [key, val] of Object.entries(src)) {
        dst[key] = val;
      }
    });
  };

  port.addEventListener?.('message', onMessage, { signal: life.signal });
  return life;
}
