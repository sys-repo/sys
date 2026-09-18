import { Arr, Fs, Is, type t } from '../common.ts';
import { PiEnv } from './u.env.ts';

/**
 * Resolve the effective Pi runtime root from the cwd contract.
 */
export function runtimeRoot(cwd: t.PiCli.Cwd, context = 'Pi'): t.StringDir {
  const root = cwd.root ?? cwd.git;
  if (!root) throw new Error(`${context} requires a resolved runtime root.`);
  return root;
}

/**
 * Determine whether the cwd contract is backed by a git root.
 */
export function isGitRooted(cwd: t.PiCli.Cwd) {
  return Is.string(cwd.git);
}

/**
 * Determine whether the cwd contract uses an explicit non-git runtime root.
 */
export function isGitlessRoot(
  cwd: t.PiCli.Cwd,
): cwd is t.PiCli.Cwd & { readonly root: t.StringDir } {
  return Is.string(cwd.root) && !isGitRooted(cwd);
}

/**
 * Resolve temp roots used for launcher-owned transient artifacts.
 */
export async function resolveTempArtifactRoots(): Promise<readonly t.StringPath[]> {
  const tmpDir = await PiEnv.toTmpDir();
  return Arr.uniq([Fs.resolve(tmpDir) as t.StringPath]);
}
