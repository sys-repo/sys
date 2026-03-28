import { type t, Esm } from './common.ts';

export const order: t.WorkspaceGraph.Lib['order'] = (graph) => {
  const result = Esm.Topological.build({
    nodes: graph.packages.map((pkg) => ({ key: pkg.path, value: pkg })),
    edges: graph.edges.map((edge) => ({ from: edge.from, to: edge.to })),
  });

  if (result.ok) {
    return {
      ok: true,
      graph,
      items: result.items.map((item) => ({
        package: item.node.value,
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
