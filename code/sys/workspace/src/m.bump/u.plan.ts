import { type t } from './common.ts';

export const plan: t.WorkspaceBump.Lib['plan'] = async (args) => {
  const rootPkgPaths = [...new Set(args.rootPkgPaths)];
  if (rootPkgPaths.length === 0) throw new Error('At least one bump root is required.');

  const rootSet = new Set(rootPkgPaths);
  const roots = args.collect.candidates.filter((candidate) => rootSet.has(candidate.pkgPath));
  const missing = rootPkgPaths.filter((pkgPath) =>
    !roots.some((candidate) => candidate.pkgPath === pkgPath)
  );
  if (missing.length > 0) throw new Error(`Unknown bump roots: ${missing.join(', ')}`);

  const selectedPaths = dependentClosure(
    rootPkgPaths,
    args.collect.edges,
    args.collect.orderedPaths,
  );
  const selected = args.collect.candidates.filter((candidate) =>
    selectedPaths.includes(candidate.pkgPath)
  );
  return { roots, selected, selectedPaths };
};

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
