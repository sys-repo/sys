import { Git } from '@sys/driver-process/git';
import { type t, Fs, detectRepoRoot } from './common.ts';
import { selectAndCopy } from './u.copy.ts';

export async function copyGitChanged(cwd: t.StringDir) {
  const repoRootAbs = await detectRepoRoot(cwd);
  const status = await Git.status({ cwd: repoRootAbs, untracked: true });
  if (!status.ok) {
    const err = status.error ? ` ${String(status.error)}` : '';
    console.info(`Git.status probe returned ${status.reason}.${err}`);
    return;
  }

  const uniquePaths = new Set<string>();
  for (const entry of status.entries) {
    const rel = entry.pathTo ?? entry.path;
    const abs = Fs.join(repoRootAbs, rel);
    uniquePaths.add(abs);
  }

  const paths = [...uniquePaths];
  if (paths.length === 0) {
    console.info('No changed files found.');
    return;
  }

  await selectAndCopy(paths, {
    dir: repoRootAbs,
    repoRootAbs,
    message: 'Select changed/untracked files to copy:\n',
    totalLabel: 'files',
    sort: true,
  });
}
