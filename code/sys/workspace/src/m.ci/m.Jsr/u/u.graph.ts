import { Is, type t } from '../../common.ts';
import type { Module } from './u.module.ts';

type O = Record<string, unknown>;

export type ModuleStratum = {
  readonly index: number;
  readonly modules: readonly Module[];
};

export function deriveStrata(
  modules: readonly Module[],
  graph?: t.WorkspaceGraph.PersistedGraph,
): readonly ModuleStratum[] {
  if (modules.length === 0) return [];

  const byPath = new Map<t.StringPath, Module>();
  for (const module of modules) {
    if (byPath.has(module.path)) {
      throw new Error(`Duplicate JSR publish module path: ${module.path}`);
    }
    byPath.set(module.path, module);
  }

  const dependencies = new Map<t.StringPath, Set<t.StringPath>>();
  for (const module of modules) dependencies.set(module.path, new Set());

  const selected = new Set(byPath.keys());
  for (const edge of graph?.edges ?? []) {
    if (!selected.has(edge.from) || !selected.has(edge.to)) continue;
    dependencies.get(edge.to)?.add(edge.from);
  }

  const levels = new Map<t.StringPath, number>();
  const visiting = new Set<t.StringPath>();
  const stack: t.StringPath[] = [];

  const levelOf = (path: t.StringPath): number => {
    const existing = levels.get(path);
    if (existing !== undefined) return existing;

    if (visiting.has(path)) {
      const start = stack.indexOf(path);
      const cycle = [...stack.slice(start), path].join(' → ');
      throw new Error(`Cycle in selected JSR publish graph: ${cycle}`);
    }

    const deps = dependencies.get(path);
    if (!deps) throw new Error(`Unknown JSR publish module path: ${path}`);

    visiting.add(path);
    stack.push(path);
    let level = 0;
    for (const dep of deps) level = Math.max(level, levelOf(dep) + 1);
    stack.pop();
    visiting.delete(path);

    levels.set(path, level);
    return level;
  };

  for (const module of modules) levelOf(module.path);

  const buckets = new Map<number, Module[]>();
  for (const module of modules) {
    const level = levels.get(module.path) ?? 0;
    const bucket = buckets.get(level) ?? [];
    bucket.push(module);
    buckets.set(level, bucket);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, items]) => ({ index, modules: items }));
}

export function parsePersistedGraph(data: unknown): t.WorkspaceGraph.PersistedGraph | undefined {
  if (!Is.record<O>(data)) return undefined;
  const graph = data.graph;
  if (!Is.record<O>(graph)) return undefined;
  if (!Array.isArray(graph.orderedPaths) || !graph.orderedPaths.every(Is.str)) return undefined;
  if (!Array.isArray(graph.edges)) return undefined;

  const edges = graph.edges
    .map((edge) => parseGraphEdge(edge))
    .filter((edge): edge is t.WorkspaceGraph.PersistedEdge => !!edge);
  if (edges.length !== graph.edges.length) return undefined;

  return {
    orderedPaths: graph.orderedPaths as readonly t.StringPath[],
    edges,
  };
}

function parseGraphEdge(data: unknown): t.WorkspaceGraph.PersistedEdge | undefined {
  if (!Is.record<O>(data)) return undefined;
  if (!Is.str(data.from) || !Is.str(data.to)) return undefined;
  return { from: data.from as t.StringPath, to: data.to as t.StringPath };
}
