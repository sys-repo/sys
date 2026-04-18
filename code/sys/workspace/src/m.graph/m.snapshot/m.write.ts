import { type t, JsonFile, Obj } from './common.ts';
import { defaultDoc } from './u.defaultDoc.ts';
import { GraphHash } from './m.Hash.ts';
import { meta } from './u.meta.ts';
import { parseSnapshot } from './u.parse.ts';

type D = t.WorkspaceGraph.Snapshot.Doc;
type G = t.WorkspaceGraph.PersistedGraph;

export const write: t.WorkspaceGraph.Snapshot.Lib['write'] = async (snapshot, path) => {
  const { graph, digest } = GraphHash.snapshot(snapshot.graph);

  const file = await JsonFile.get<D>(path, defaultDoc(), { touch: true });
  file.change((doc) =>
    applyWrite(doc as t.DeepMutable<D>, {
      snapshot,
      graph,
      graphHash: digest,
    })
  );

  const { error } = await file.fs.save();
  if (error) throw error;

  const parsed = parseSnapshot(file.current);
  if (!parsed) {
    throw new Error(`Workspace.Graph.Snapshot.write: invalid snapshot persisted at "${path}"`);
  }
  return parsed;
};

/**
 * Helpers
 */
function applyWrite(
  doc: t.DeepMutable<D>,
  args: { snapshot: D; graph: G; graphHash: t.StringHash },
) {
  const { snapshot, graph, graphHash } = args;
  const createdAt = snapshot['.meta'].createdAt || doc['.meta'].createdAt;
  const root = doc as t.DeepMutable<Record<string, unknown>> & t.DeepMutable<D>;

  for (const key of Object.keys(root)) {
    if (key === '.meta' || key === 'graph') continue;
    delete root[key];
  }

  root['.meta'] = meta({
    createdAt,
    graphHash,
    generator: snapshot['.meta'].generator,
    hashPolicy: snapshot['.meta'].hash['/graph:policy'],
  });

  root.graph = Obj.clone(graph) as t.DeepMutable<G>;
}
