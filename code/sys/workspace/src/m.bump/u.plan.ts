import { type t } from './common.ts';

export const plan: t.WorkspaceBump.Lib['plan'] = async (args) => {
  const root = args.collect.candidates.find((candidate) => candidate.pkgPath === args.rootPkgPath);
  if (!root) throw new Error(`Unknown bump root: ${args.rootPkgPath}`);

  const selectedPaths = dependentClosure(args.rootPkgPath, args.collect.edges, args.collect.orderedPaths);
  const selected = args.collect.candidates.filter((candidate) => selectedPaths.includes(candidate.pkgPath));
  return { root, selected, selectedPaths };
};

export function dependentClosure(
  rootPkgPath: t.StringPath,
  edges: readonly t.WorkspaceBump.PackageEdge[],
  orderedPaths: readonly t.StringPath[],
) {
  const queue = [rootPkgPath];
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
