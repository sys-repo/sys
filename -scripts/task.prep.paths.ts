import { Workspace } from '@sys/workspace';
import { Fs, Is, TmplEngine } from './common.ts';

const PATHS_FILE = './-scripts/-PATHS.ts' as const;
const START_MARKER = '// generated:start workspace-topological';
const END_MARKER = '// generated:end workspace-topological';

export function renderPaths(paths: readonly string[]) {
  return paths.map((value) => `    '${value}',`);
}

export async function orderedWorkspacePaths(cwd = Deno.cwd()) {
  const deno = (await Fs.readJson<Record<string, unknown>>(Fs.join(cwd, 'deno.json'))).data ?? {};
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

  return ordered.items.map((item) => item.package.path);
}

export async function main(path: string = PATHS_FILE, paths?: readonly string[]) {
  const nextPaths = paths ?? (await orderedWorkspacePaths());
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
