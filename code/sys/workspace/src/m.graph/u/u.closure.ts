import { type t } from '../common.ts';

/**
 * Derive the dependent package closure for selected workspace package roots.
 */
export function dependentClosure(
  rootPkgPaths: readonly t.StringPath[],
  edges: readonly t.WorkspaceGraph.DirectedEdge[],
  orderedPaths: readonly t.StringPath[],
) {
  const queue = [...new Set(rootPkgPaths)];
  const seen = new Set<t.StringPath>(queue);

  for (let cursor = 0; cursor < queue.length; cursor++) {
    const next = queue[cursor]!;
    for (const edge of edges) {
      if (edge.from !== next || seen.has(edge.to)) continue;
      seen.add(edge.to);
      queue.push(edge.to);
    }
  }

  return orderedPaths.filter((path) => seen.has(path));
}

/**
 * Reduce selected roots to the smallest stable source set that produces the
 * same dependent closure.
 */
export function minimalDependentRoots(
  rootPkgPaths: readonly t.StringPath[],
  edges: readonly t.WorkspaceGraph.DirectedEdge[],
  orderedPaths: readonly t.StringPath[],
) {
  const input = new Set(rootPkgPaths);
  const ordered = new Set(orderedPaths);
  const roots = [
    ...orderedPaths.filter((path) => input.has(path)),
    ...rootPkgPaths.filter((path) => !ordered.has(path)),
  ];
  const rootSet = new Set(roots);
  const reach = new Map<t.StringPath, Set<t.StringPath>>();

  for (const root of roots) {
    const closure = new Set(dependentClosure([root], edges, orderedPaths));
    closure.add(root);
    reach.set(root, new Set([...closure].filter((path) => rootSet.has(path))));
  }

  const groups = mutuallyReachableGroups(roots, reach);
  return groups
    .filter((group) => !isReachedFromAnotherRoot(group, roots, reach))
    .map((group) => group[0]!);
}

function mutuallyReachableGroups(
  roots: readonly t.StringPath[],
  reach: ReadonlyMap<t.StringPath, ReadonlySet<t.StringPath>>,
) {
  const groups: t.StringPath[][] = [];
  const open = new Set(roots);

  for (const root of roots) {
    if (!open.has(root)) continue;
    const group: t.StringPath[] = [];
    const queue = [root];

    for (let cursor = 0; cursor < queue.length; cursor++) {
      const next = queue[cursor]!;
      if (!open.delete(next)) continue;
      group.push(next);

      for (const candidate of roots) {
        if (!open.has(candidate)) continue;
        if (mutuallyReachable(next, candidate, reach)) queue.push(candidate);
      }
    }

    groups.push(group);
  }

  return groups;
}

function mutuallyReachable(
  a: t.StringPath,
  b: t.StringPath,
  reach: ReadonlyMap<t.StringPath, ReadonlySet<t.StringPath>>,
) {
  return Boolean(reach.get(a)?.has(b) && reach.get(b)?.has(a));
}

function isReachedFromAnotherRoot(
  group: readonly t.StringPath[],
  roots: readonly t.StringPath[],
  reach: ReadonlyMap<t.StringPath, ReadonlySet<t.StringPath>>,
) {
  const groupSet = new Set(group);
  return roots.some((other) =>
    !groupSet.has(other) && group.some((root) => Boolean(reach.get(other)?.has(root)))
  );
}
