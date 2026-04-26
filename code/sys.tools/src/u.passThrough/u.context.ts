import { DenoFile, Fs, type t } from '../common.ts';
import type {
  PassThroughContext,
  PassThroughRepoShape,
  PassThroughTarget,
  PassThroughWorkspaceInfo,
} from './t.ts';

type Args = {
  readonly cwd: t.StringDir;
  readonly target: PassThroughTarget;
};

/**
 * Resolve the local-vs-published delegation context for one thin wrapper.
 */
export async function resolvePassThroughContext(args: Args): Promise<PassThroughContext> {
  const nearest = await DenoFile.nearest(args.cwd, (e) => Array.isArray(e.file.workspace));
  if (!nearest?.is.workspace) {
    return {
      cwd: args.cwd,
      mode: 'published',
      reason: 'no-workspace',
      specifier: args.target.publishedSpecifier,
      target: args.target,
    };
  }

  const workspace = await DenoFile.workspace(nearest.path, { walkup: false }) as PassThroughWorkspaceInfo;
  if (!matchesRepoShape(workspace, args.target.repo)) {
    return {
      cwd: args.cwd,
      mode: 'published',
      reason: 'workspace-mismatch',
      specifier: args.target.publishedSpecifier,
      target: args.target,
      workspace: { dir: workspace.dir, file: workspace.file },
    };
  }

  return {
    cwd: args.cwd,
    mode: 'local',
    reason: 'system-workspace',
    specifier: args.target.localSpecifier,
    target: args.target,
    workspace: { dir: workspace.dir, file: workspace.file },
  };
}

const DEFAULT_CONFIG_FILENAMES = ['deno.json', 'deno.jsonc'] as const;

function matchesRepoShape(ws: PassThroughWorkspaceInfo, repo: PassThroughRepoShape): boolean {
  if (!ws.exists) return false;
  if (repo.rootDirname && Fs.basename(ws.dir) !== repo.rootDirname) return false;

  const configNames = repo.configFilenames ?? DEFAULT_CONFIG_FILENAMES;
  if (!configNames.includes(Fs.basename(ws.file))) return false;

  const names = new Set(ws.children.map((child) => child.pkg.name));
  if (!repo.requiredPackages.every((name) => names.has(name))) return false;

  const dirs = new Set(ws.children.map((child) => child.path.dir));
  if (!repo.requiredDirs.every((dir) => dirs.has(dir as t.StringDir))) return false;

  return true;
}
