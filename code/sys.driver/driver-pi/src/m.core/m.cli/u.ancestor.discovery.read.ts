import { Fs, type t } from './common.ts';
import { isGitlessRoot } from './u.runtime-root.ts';

/**
 * Upstream Pi auto-discovers ancestor .agents/skills and probes for a .git root
 * before its --no-skills flag takes effect. When the wrapper is intentionally
 * gitless, keep those probes narrow so a scoped Deno sandbox does not need broad
 * ancestor read grants.
 */
export function toAncestorDiscoveryReadScope(cwd: t.PiCli.Cwd): t.StringPath[] {
  if (!isGitlessRoot(cwd)) return [];
  return toParentProbePaths(cwd.root);
}

export function isAncestorDiscoveryRead(cwd: t.PiCli.Cwd, path: t.StringPath) {
  return toAncestorDiscoveryReadScope(cwd).includes(path);
}

function toParentProbePaths(root: t.StringDir) {
  const paths: t.StringPath[] = [];
  let dir = Fs.dirname(root) as t.StringDir;

  while (true) {
    paths.push(Fs.join(dir, '.git') as t.StringPath);
    paths.push(Fs.join(dir, '.agents', 'skills') as t.StringPath);

    const parent = Fs.dirname(dir) as t.StringDir;
    if (parent === dir) break;
    dir = parent;
  }

  return paths;
}
