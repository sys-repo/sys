import { type t } from './common.ts';

export function cloneGraph(
  graph: t.WorkspaceGraph.PersistedGraph,
): t.WorkspaceGraph.PersistedGraph {
  return {
    orderedPaths: [...graph.orderedPaths],
    edges: graph.edges.map((edge) => ({ from: edge.from, to: edge.to })),
  };
}
