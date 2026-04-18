import { type t, Hash } from './common.ts';
import { cloneGraph } from './u.graph.ts';

/**
 * Canonical hash policy for persisted workspace graph snapshots.
 */
export const GraphHash = {
  snapshot(graph: t.WorkspaceGraph.PersistedGraph) {
    const normalized = cloneGraph(graph);
    return {
      graph: normalized,
      digest: Hash.sha256(normalized),
    } as const;
  },
} as const;
