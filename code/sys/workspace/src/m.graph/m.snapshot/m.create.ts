import { type t, Hash, Time } from './common.ts';
import { cloneGraph } from './u.graph.ts';
import { meta } from './u.meta.ts';

export const create: t.WorkspaceGraph.Snapshot.Lib['create'] = (args) => {
  const graph = cloneGraph(args.graph);
  const graphHash = Hash.sha256(graph);
  return {
    '.meta': meta({
      createdAt: Time.now.timestamp,
      graphHash,
    }),
    graph,
  };
};
