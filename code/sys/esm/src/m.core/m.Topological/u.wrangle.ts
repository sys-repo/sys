import { type t } from './common.ts';

export const wrangle = {
  duplicates(keys: readonly string[]) {
    const seen = new Set<string>();
    const dup = new Set<string>();
    for (const key of keys) {
      if (seen.has(key)) dup.add(key);
      seen.add(key);
    }
    return [...dup].sort((a, b) => a.localeCompare(b));
  },

  unknownEdgeKeys(
    edges: readonly t.EsmTopological.Edge[],
    nodeByKey: ReadonlyMap<string, t.EsmTopological.Node<unknown>>,
  ) {
    const unknown = new Set<string>();
    for (const edge of edges) {
      if (!nodeByKey.has(edge.from)) unknown.add(edge.from);
      if (!nodeByKey.has(edge.to)) unknown.add(edge.to);
    }
    return [...unknown].sort((a, b) => a.localeCompare(b));
  },
} as const;
