import { type t, Crdt } from '../common.ts';
import { makeDiscoverRefs } from './u.discoverRefs.ts';
import { makeLoad } from './u.load.ts';

type O = Record<string, unknown>;
type CmdClient = t.Crdt.Cmd.Client;

export async function buildDocumentDAG(cmd: CmdClient, root: t.Crdt.Id, path: t.ObjectPath) {
  const load = makeLoad(cmd);
  const discoverRefs = makeDiscoverRefs(path);
  return await Crdt.Graph.Dag.build<O>({
    id: root,
    load,
    discoverRefs,
  });
}
