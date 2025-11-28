import { type t, Crdt, Is, Obj, Yaml } from '../common.ts';

/**
 * Function factory:
 * Lookup up "crdt:<id>" references within the given document.
 */
export function makeDiscoverRefs(path: t.ObjectPath) {
  const discoverRefs: t.Crdt.Graph.DiscoverRefs = ({ doc }) => {
    const yaml = Obj.Path.get<string>(doc.current, path);
    if (!Is.string(yaml)) return [];

    const obj = Yaml.parse(yaml).data;
    if (!Obj.isRecord(obj)) return [];

    const refs: t.Crdt.Id[] = [];
    const pushIfId = (value: unknown) => {
      const id = Is.str(value) ? Crdt.Id.fromUri(value) : '';
      if (id) refs.push(id);
    };

    Obj.walk(obj, (e) => pushIfId(e.value));
    return refs;
  };

  return discoverRefs;
}
