import { type t, Crdt, Obj } from '../common.ts';

export function makeDiscoverRefs(path: t.ObjectPath): t.Crdt.Graph.DiscoverRefs {
  return async (e) => {
    const yaml = Obj.Path.get<string>(e.doc.current, path) ?? '';
    return Crdt.Str.extractRefs(yaml)
      .map((id) => Crdt.Id.fromUri(id))
      .filter((id) => Crdt.Is.id(id));
  };
}
