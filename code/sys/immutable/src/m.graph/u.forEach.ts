import { type t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Iterate all nodes in the DAG in stored order.
 */
function _forEach<T extends O = O>(
  dag: t.Graph.Dag.Result<T>,
  fn: (node: t.Graph.Dag.Node<T>) => void,
): void {
  for (const node of dag.nodes) {
    fn(node);
  }
}

/**
 * Iterate all nodes in the DAG in stored order, awaiting async callbacks.
 */
async function _forEachAsync<T extends O = O>(
  dag: t.Graph.Dag.Result<T>,
  fn: (node: t.Graph.Dag.Node<T>) => Promise<void> | void,
): Promise<void> {
  for (const node of dag.nodes) {
    await fn(node);
  }
}

export const forEach: t.Graph.Dag.ForEach = _forEach;
export const forEachAsync: t.Graph.Dag.ForEachAsync = _forEachAsync;
