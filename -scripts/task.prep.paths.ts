import { Workspace } from '@sys/workspace';
import { Fs, TmplEngine } from './common.ts';

const PATHS_FILE = './-scripts/-PATHS.ts' as const;
export const WORKSPACE_GRAPH_CACHE_FILE = Workspace.Prep.State.graphFile(Fs.cwd());
const START_MARKER = '// generated:start workspace-topological';
const END_MARKER = '// generated:end workspace-topological';
type WorkspaceGraphCache = Awaited<ReturnType<typeof Workspace.Graph.Snapshot.create>>['graph'];
export function renderPaths(paths: readonly string[]) {
  return paths.map((value) => `    '${value}',`);
}

export function buildWorkspaceGraphCache(cwd = Fs.cwd()): Promise<WorkspaceGraphCache> {
  return Workspace.Prep.Graph.build(cwd);
}

export async function readWorkspaceGraphCache(path: string = WORKSPACE_GRAPH_CACHE_FILE) {
  const snapshot = await Workspace.Prep.Graph.read(workspaceCwdFromGraphFile(path));
  return snapshot?.graph;
}

export async function writeWorkspaceGraphCache(
  cache: WorkspaceGraphCache,
  path: string = WORKSPACE_GRAPH_CACHE_FILE,
) {
  const snapshot = Workspace.Prep.Graph.snapshot(cache);
  const written = await Workspace.Prep.Graph.write({ cwd: workspaceCwdFromGraphFile(path), snapshot });
  return written.snapshot.graph;
}

export async function orderedWorkspacePaths(cwd = Fs.cwd()) {
  const cache = await buildWorkspaceGraphCache(cwd);
  return cache.orderedPaths;
}

export async function main(path: string = PATHS_FILE, paths?: readonly string[]) {
  const graph = paths ? undefined : (await Workspace.Prep.Graph.ensure()).snapshot.graph;
  const nextPaths = paths ?? graph?.orderedPaths ?? [];
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

/**
 * Helpers:
 */
function workspaceCwdFromGraphFile(path: string) {
  return Fs.dirname(Fs.dirname(path));
}
