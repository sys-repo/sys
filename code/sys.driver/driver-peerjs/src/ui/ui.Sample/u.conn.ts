import { type t, Obj } from './common.ts';
import { maintainDyadConnection } from './u.maintainDyad.ts';

export const Conn = {
  maintainDyadConnection,

  /**
   * Produce every unique, lexicographically-ordered 1-to-1
   * pairing ( PeerDyad ) from a set of peer-ids.
   */
  toDyads(peers: t.WebRtc.PeerId[] = []): t.WebRtc.PeerDyad[] {
    const ids = Array.from(new Set(peers)); // ← ensure uniqueness.
    const out: t.WebRtc.PeerDyad[] = [];

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i];
        const b = ids[j];
        // NB: ensure stable order inside each tuple.
        const sorted = (a < b ? [a, b] : [b, a]) as t.WebRtc.PeerDyad;
        out.push(sorted);
      }
    }

    return out.toSorted(([a1, b1], [a2, b2]) =>
      a1 === a2 ? (b1 < b2 ? -1 : 1) : a1 < a2 ? -1 : 1,
    ) as t.WebRtc.PeerDyad[];
  },

  /**
   * Keep the `dyads` list in up-to-date with the current peer `group` list.
   */
  updateDyads(doc?: t.CrdtRef<t.SampleDoc>) {
    const connections = doc?.current.connections;
    if (!connections) return false;

    const group = connections?.group ?? [];
    const current = [...(connections?.dyads ?? [])];
    const next = Conn.toDyads(group);
    const diff = !Obj.eql(current, next);

    if (diff) {
      doc?.change((d) => {
        Obj.Path.Mutate.ensure(d, ['connections', 'dyads'], []);
        d.connections!.dyads = next;
      });
    }

    return diff;
  },
} as const;
