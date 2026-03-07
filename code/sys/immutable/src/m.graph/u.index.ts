import { type t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Build a read-only index of nodes by id for fast lookup.
 */
function indexDag<T extends O = O>(
  dag: t.Graph.Dag.Result<T>,
): ReadonlyMap<t.StringId, t.Graph.Dag.Node<T>> {
  const map = new Map<t.StringId, t.Graph.Dag.Node<T>>();
  for (const node of dag.nodes) {
    map.set(node.id, node);
  }
  return map;
}

export const index: t.Graph.Dag.Index = indexDag;
