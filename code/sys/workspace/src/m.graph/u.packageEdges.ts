import { type t, Str } from './common.ts';

const compare = Str.Compare.codeUnit();

export const packageEdges: t.WorkspaceGraph.Lib['packageEdges'] = (graph) => {
  const moduleByKey = new Map(graph.modules.map((module) => [module.key, module] as const));
  const edges = new Map<string, t.WorkspaceGraph.PackageEdge>();

  for (const edge of graph.edges) {
    const dependent = moduleByKey.get(edge.from);
    const dependency = moduleByKey.get(edge.to);
    if (!dependent || !dependency) continue;
    if (dependent.packagePath === dependency.packagePath) continue;

    const key = `${dependency.packagePath}->${dependent.packagePath}`;
    const current = edges.get(key) ?? {
      from: dependency.packagePath,
      to: dependent.packagePath,
      imports: [],
    };
    // Keep witness imports incrementally sorted for deterministic output at the
    // current N; if this becomes hot, batch the sort after accumulation.
    edges.set(key, {
      ...current,
      imports: [...current.imports, { from: edge.from, to: edge.to, kind: edge.kind }].toSorted(
        (a, b) => compare(a.from, b.from) || compare(a.to, b.to) || compare(a.kind, b.kind),
      ),
    });
  }

  return {
    cwd: graph.cwd,
    packages: [...graph.packages].toSorted((a, b) => compare(a.path, b.path)),
    edges: [...edges.values()].toSorted((a, b) => compare(a.from, b.from) || compare(a.to, b.to)),
  };
};
