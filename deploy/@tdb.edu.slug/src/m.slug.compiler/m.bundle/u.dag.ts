import { Obj } from '@sys/std';

import { type t, Crdt } from './common.ts';

type O = Record<string, unknown>;
type CmdClient = t.Crdt.Cmd.Client;

/**
 * Build a CRDT document DAG from a root id and YAML path.
 */
export async function buildDocumentDag(cmd: CmdClient, id: t.Crdt.Id, path: t.ObjectPath) {
  const load = makeLoad(cmd);
  const discoverRefs = makeDiscoverRefs(path);
  return await Crdt.Graph.Dag.build<O>({
    id,
    load,
    discoverRefs,
  });
}

/**
 * Factory for a command-backed CRDT document loader.
 */
function makeLoad(cmd: CmdClient): t.Crdt.Graph.LoadDoc<O> {
  return async (id) => {
    const result = await cmd.send('doc:read', { doc: id });
    const current = result.value as O | undefined;
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
