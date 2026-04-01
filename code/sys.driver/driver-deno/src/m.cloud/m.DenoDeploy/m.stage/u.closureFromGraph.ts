import { Str, type t } from './common.ts';

/**
 * Resolve the target package and its transitive workspace package dependencies.
 *
 * Edge direction in the persisted graph is:
 * - `from` = dependency
 * - `to` = dependent
 */
export function closureFromGraph(
  graph: t.WorkspaceGraph.PersistedGraph,
  target: t.StringPath,
): ReadonlySet<t.StringPath> {
  const retain = new Set<t.StringPath>();
  const queue = [wrangle.normalizePackagePath(target)];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || retain.has(current)) continue;
    retain.add(current);

    for (const edge of graph.edges) {
      if (wrangle.normalizePackagePath(edge.to) !== current) continue;
      const dependency = wrangle.normalizePackagePath(edge.from);
      if (!retain.has(dependency)) queue.push(dependency);
    }
  }

  return retain;
}

const wrangle = {
  normalizePackagePath(path: string): t.StringPath {
    return Str.trimTrailingSlashes(Str.trimLeadingDotSlash(path));
  },
} as const;
