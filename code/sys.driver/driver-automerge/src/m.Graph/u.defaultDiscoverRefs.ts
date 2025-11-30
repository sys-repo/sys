import { type t, Is, CrdtId, Obj } from './common.ts';

type O = Record<string, unknown>;

/**
 * Default edge discovery:
 *
 * - walks `doc.current` via `Obj.walk`
 * - looks for string values that are CRDT URIs
 * - normalises them to bare ids via `CrdtId.clean`
 */
export const defaultDiscoverRefs: t.Crdt.Graph.DiscoverRefs = ({ doc }) => {
  const refs: t.Crdt.Id[] = [];

  Obj.walk(doc.current, (e) => {
    const id = Is.str(e.value) ? CrdtId.fromUri(e.value) : '';
    if (id) refs.push(id);
  });

  return refs;
};
