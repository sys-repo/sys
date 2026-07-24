import { Fs, type t } from './common.ts';
import { isGitlessRoot, runtimeRoot } from './u.runtime.ts';

/**
 * Upstream Pi's project-trust preflight checks .agents/skills from cwd through
 * every ancestor before --no-skills is honored, regardless of git-root mode.
 * The runtime root is already readable, so grant only exact parent probe paths.
 * Gitless launches separately need exact ancestor .git probes for upstream root
 * discovery; never grant ambient ancestor directories.
 */
export function toAncestorDiscoveryReadScope(cwd: t.PiCli.Cwd): t.StringPath[] {
  return toParentProbePaths(runtimeRoot(cwd), isGitlessRoot(cwd));
}

export function isAncestorDiscoveryRead(cwd: t.PiCli.Cwd, path: t.StringPath) {
  return toAncestorDiscoveryReadScope(cwd).includes(path);
}

function toParentProbePaths(root: t.StringDir, includeGit: boolean) {
  const paths: t.StringPath[] = [];
  let dir = Fs.dirname(root) as t.StringDir;

  while (true) {
    if (includeGit) paths.push(Fs.join(dir, '.git') as t.StringPath);
    paths.push(Fs.join(dir, '.agents', 'skills') as t.StringPath);

    const parent = Fs.dirname(dir) as t.StringDir;
    if (parent === dir) break;
    dir = parent;
  }

  return paths;
}
