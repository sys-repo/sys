import { type t, Crdt, Obj } from './common.ts';

/**
 * Build a CRDT document DAG from a root id and YAML path.
 */
export async function buildDocumentDag(
  cmd: t.BundleCmdClient,
  id: t.Crdt.Id,
  path: t.ObjectPath,
) {
  const load = makeLoad(cmd);
  const discoverRefs = makeDiscoverRefs(path);
  return await Crdt.Graph.Dag.build<t.BundleDagObject>({
    id,
    load,
    discoverRefs,
  });
}

/**
 * Factory for a command-backed CRDT document loader.
 */
function makeLoad(cmd: t.BundleCmdClient): t.Crdt.Graph.LoadDoc<t.BundleDagObject> {
  return async (id) => {
    const result = await cmd.send('doc:read', { doc: id });
    const current = result.value as t.BundleDagObject | undefined;
    return current ? { current } : undefined;
  };
}

function makeDiscoverRefs(path: t.ObjectPath): t.Crdt.Graph.DiscoverRefs {
  return async (e) => {
    const yaml = Obj.Path.get<string>(e.doc.current, path) ?? '';
    return Crdt.Str.extractRefs(yaml)
      .map((id) => Crdt.Id.fromUri(id))
      .filter((id) => Crdt.Is.id(id));
  };
}
