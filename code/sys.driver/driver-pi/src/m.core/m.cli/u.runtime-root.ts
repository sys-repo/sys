import { Is, type t } from './common.ts';

export function runtimeRoot(cwd: t.PiCli.Cwd, context = 'Pi'): t.StringDir {
  const root = cwd.root ?? cwd.git;
  if (!root) throw new Error(`${context} requires a resolved runtime root.`);
  return root;
}

export function isGitRooted(cwd: t.PiCli.Cwd) {
  return Is.string(cwd.git);
}

export function isGitlessRoot(
  cwd: t.PiCli.Cwd,
): cwd is t.PiCli.Cwd & { readonly root: t.StringDir } {
  return Is.string(cwd.root) && !isGitRooted(cwd);
}
