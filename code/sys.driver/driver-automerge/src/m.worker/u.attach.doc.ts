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
      payload: { id: doc.id, value: doc.current as T },
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
    const msg: t.WireDocEventPayload<T> = {
      type: 'doc/deleted',
      payload: { id: doc.id },
    };
    port.postMessage(Wire.event(stream, msg));
  });

  return life;
}
