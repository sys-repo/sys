import { type t, Esm } from './common.ts';
import { toNode } from './u.topological.ts';

export const order: t.WorkspaceGraph.Lib['order'] = (graph) => {
  const packageByPath = new Map(graph.packages.map((pkg) => [pkg.path, pkg] as const));
  const result = Esm.Topological.build({
    nodes: graph.packages.map((pkg) => toNode(pkg)),
    edges: graph.edges.map((edge) => ({ from: edge.from, to: edge.to })),
  });

  if (result.ok) {
    return {
      ok: true,
      graph,
      items: result.items.map((item) => ({
        package: packageByPath.get(item.node.key)!,
        index: item.index,
        after: item.after,
      })),
    };
  }

  if ('invalid' in result) {
    const code =
      result.invalid.code === 'node:duplicate-key'
        ? 'package:duplicate-key'
        : 'package-edge:unknown-node';

    return {
      ok: false,
      graph,
      invalid: { code, keys: result.invalid.keys },
    };
  }

  return {
    ok: false,
    graph,
    cycle: result.cycle,
  };
};
