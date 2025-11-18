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
  const id = doc.id;
  const life = Rx.abortable(until);
  const stream = Wire.Kind.doc(id);


  /**
   * Emit initial snapshot so the proxy can populate `current`.
   */
  const emitSnapshot = () => {
    const msg: t.WireDocEventPayload<T> = {
      type: 'doc/snapshot',
      payload: { id, value: doc.current as T },
    };
    port.postMessage(Wire.event(stream, msg));
  };

  // emitSnapshot();

  /**
   * Subscribe to doc events and mirror them to wire.
   */
  const ev = doc.events(life.dispose$);
  ev.$.subscribe((change) => {
  });

  ev.deleted$.subscribe(() => {
    const msg: t.WireDocEventPayload<T> = { type: 'doc/deleted', payload: { id } };
    port.postMessage(Wire.event(stream, msg));
  });

  return life;
}
