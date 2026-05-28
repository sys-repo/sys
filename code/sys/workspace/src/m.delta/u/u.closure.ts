import { type t } from '../common.ts';

/**
 * Derive the dependent package closure for selected workspace package roots.
 */
export function dependentClosure(
  rootPkgPaths: readonly t.StringPath[],
  edges: readonly t.WorkspaceBump.PackageEdge[],
  orderedPaths: readonly t.StringPath[],
) {
  const queue = [...new Set(rootPkgPaths)];
  const seen = new Set<t.StringPath>(queue);

  while (queue.length > 0) {
    const next = queue.shift()!;
    for (const edge of edges) {
      if (edge.from !== next || seen.has(edge.to)) continue;
      seen.add(edge.to);
      queue.push(edge.to);
    }
  }

  return orderedPaths.filter((path) => seen.has(path));
}
