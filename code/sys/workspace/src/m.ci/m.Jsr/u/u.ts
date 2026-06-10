import { Err, Fs, Is, type t } from '../../common.ts';
import { WorkflowSafe } from '../../u/u.safe.ts';
import { JSR_BODY_TEMPLATE } from './u.tmpl.ts';

type O = Record<string, unknown>;

export type Module = {
  readonly path: t.StringPath;
  readonly name: t.StringPkgName;
  readonly version: t.StringSemver;
};

type DenoJson = {
  readonly name?: string;
  readonly version?: string;
};

export async function loadModule(cwd: t.StringDir, path: t.StringPath): Promise<Module> {
  const resolved = Fs.join(Fs.resolve(cwd, path), 'deno.json');
  const res = await Fs.readJson<DenoJson>(resolved);
  const file = res.data;
  if (!res.ok || !file) {
    const cause = res.error;
    throw Err.std(`Failed to load module deno.json: ${resolved}`, { cause });
  }

  const name = file.name;
  if (!Is.str(name) || !name) {
    throw new Error(`Module deno.json is missing "name": ${resolved}`);
  }
  const version = file.version;
  if (!Is.str(version) || !version) {
    throw new Error(`Module deno.json is missing "version": ${resolved}`);
  }

  return {
    path,
    name,
    version,
  } as const;
}

export type ModuleStratum = {
  readonly index: number;
  readonly modules: readonly Module[];
};

export function toModuleYaml(module: Pick<Module, 'path' | 'name' | 'version'>) {
  const name = WorkflowSafe.scalar(module.name, 'package name');
  const path = WorkflowSafe.scalar(module.path, 'package path');
  const version = WorkflowSafe.scalar(module.version, 'package version');
  return JSR_BODY_TEMPLATE
    .replaceAll('__NAME__', name)
    .replaceAll('__PATH__', path)
    .replaceAll('__VERSION__', version);
}

export function toMatrixEntryYaml(module: Pick<Module, 'path' | 'name' | 'version'>) {
  const name = WorkflowSafe.scalar(module.name, 'package name');
  const path = WorkflowSafe.scalar(module.path, 'package path');
  const version = WorkflowSafe.scalar(module.version, 'package version');
  return [`- name: "${name}"`, `  path: "${path}"`, `  version: "${version}"`].join('\n');
}

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
