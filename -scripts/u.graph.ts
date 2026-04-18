import { Workspace } from '@sys/workspace';
import type { WorkspaceGraph } from '@sys/workspace/t';
import { Fs } from './common.ts';

export function buildWorkspaceGraphCache(cwd = Fs.cwd()): Promise<WorkspaceGraph.PersistedGraph> {
  return Workspace.Prep.Graph.build(cwd);
}

export async function readWorkspaceGraphCache(cwd = Fs.cwd()) {
  const snapshot = await Workspace.Prep.Graph.read(cwd);
  return snapshot?.graph;
}

export async function writeWorkspaceGraphCache(
  cache: WorkspaceGraph.PersistedGraph,
  cwd = Fs.cwd(),
) {
  const snapshot = Workspace.Prep.Graph.snapshot(cache);
  const written = await Workspace.Prep.Graph.write({ cwd, snapshot });
  return written.snapshot.graph;
}

export async function requireWorkspaceGraphCache(cwd = Fs.cwd()) {
  const cache = await readWorkspaceGraphCache(cwd);
  if (cache) return cache;

  const path = Workspace.Prep.State.graphFile(cwd);
  throw new Error(`Workspace graph missing at '${path}' — run 'deno task prep:graph'`);
}

export async function ensureWorkspaceGraphCache(cwd = Fs.cwd()) {
  const existing = await readWorkspaceGraphCache(cwd);
  if (existing) return existing;

  const cache = await buildWorkspaceGraphCache(cwd);
  await writeWorkspaceGraphCache(cache, cwd);
  return cache;
}

export async function orderedWorkspacePaths(cwd = Fs.cwd()) {
  const cache = await requireWorkspaceGraphCache(cwd);
  return cache.orderedPaths;
}
