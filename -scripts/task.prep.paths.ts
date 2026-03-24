import { Workspace } from '@sys/workspace';
import { Fs, Is, TmplEngine } from './common.ts';

const PATHS_FILE = './-scripts/-PATHS.ts' as const;
export const WORKSPACE_GRAPH_CACHE_FILE = './.tmp/workspace.graph.json' as const;
const START_MARKER = '// generated:start workspace-topological';
const END_MARKER = '// generated:end workspace-topological';
type WorkspaceGraphCache = Awaited<ReturnType<typeof Workspace.Graph.Snapshot.create>>['graph'];
export function renderPaths(paths: readonly string[]) {
  return paths.map((value) => `    '${value}',`);
}

export async function buildWorkspaceGraphCache(cwd = Deno.cwd()): Promise<WorkspaceGraphCache> {
  const deno = (await Fs.readJson<Record<string, unknown>>(Fs.join(cwd, 'deno.json'))).data ?? {};
  // Keep this root-workspace discovery aligned with other prep-time workspace walks
  // until package discovery is centralized behind @sys/workspace.
  const workspace = Array.isArray(deno.workspace) ? deno.workspace.filter(Is.str) : [];
  const include = workspace.map((path) => `${path}/deno.json`);

  const graph = await Workspace.Graph.collect({ cwd, source: { include } });
  const packages = Workspace.Graph.packageEdges(graph);
  const ordered = Workspace.Graph.order(packages);
  if (!ordered.ok) {
    if ('invalid' in ordered) {
      const err = `Failed to order workspace paths (${ordered.invalid.code}): ${ordered.invalid.keys.join(', ')}`;
      throw new Error(err);
    }
    throw new Error(`Failed to order workspace paths (cycle): ${ordered.cycle.keys.join(', ')}`);
  }

  return {
    orderedPaths: ordered.items.map((item) => item.package.path),
    edges: packages.edges.map((edge) => ({ from: edge.from, to: edge.to })),
  };
}

export async function readWorkspaceGraphCache(path: string = WORKSPACE_GRAPH_CACHE_FILE) {
  const snapshot = await Workspace.Graph.Snapshot.read(path);
  return snapshot?.graph;
}

export async function writeWorkspaceGraphCache(
  cache: WorkspaceGraphCache,
  path: string = WORKSPACE_GRAPH_CACHE_FILE,
) {
  await Fs.ensureDir(Fs.dirname(path));
  const snapshot = await Workspace.Graph.Snapshot.create({ graph: cache });
  await Workspace.Graph.Snapshot.write(snapshot, path);
  return snapshot.graph;
}

export async function orderedWorkspacePaths(cwd = Deno.cwd()) {
  const cache = await buildWorkspaceGraphCache(cwd);
  return cache.orderedPaths;
}

export async function main(path: string = PATHS_FILE, paths?: readonly string[]) {
  const cache = paths ? undefined : await buildWorkspaceGraphCache();
  if (cache) await writeWorkspaceGraphCache(cache);
  const nextPaths = paths ?? cache?.orderedPaths ?? [];
  const lines = renderPaths(nextPaths);
  let betweenMarkers = false;
  let sawStart = false;
  let sawEnd = false;

  const res = await TmplEngine.File.update(path, (e) => {
    const text = e.text.trim();
    if (text === START_MARKER) {
      sawStart = true;
      betweenMarkers = true;
      return;
    }

    if (text === END_MARKER) {
      sawEnd = true;
      if (!betweenMarkers) return;
      for (const line of lines) e.insert(line, 'before');
      betweenMarkers = false;
      return;
    }

    if (betweenMarkers) e.delete();
  });

  if (res.error) throw res.error;
  if (!sawStart || !sawEnd) {
    throw new Error(`Failed to update ${path}: missing generated markers`);
  }

  return res.changed;
}

if (import.meta.main) await main();
