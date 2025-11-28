import { type t, detectRepoRoot, Fs } from './common.ts';
import { selectAndCopy } from './u.copy.ts';

/**
 * Sub-command: Copy Files ("src" code).
 */
export async function copyFiles(
  cwd: t.StringDir,
  options: { initial?: 'none' | 'all'; filter?: (file: t.WalkEntry) => boolean } = {},
) {
  const { initial = 'all' } = options;
  const repoRootAbs = await detectRepoRoot(cwd); // monorepo root (stable anchor)

  const glob = Fs.glob(cwd, { includeDirs: false });
  const paths = (await glob.find('**'))
    .filter((file) => options.filter?.(file) ?? true)
    .map((file) => file.path);

  const defaultChecked = (path: string) => {
    if (initial === 'all') return true;
    if (path.includes('.test.')) return false;
    if (path.includes('-SPEC.')) return false;
    if (path.includes('-spec/')) return false;
    return false;
  };

  const eligible = paths.filter((path) => {
    const ext = Fs.extname(path);
    return ['.ts', '.tsx', '.md', '.yaml', '.json'].includes(ext);
  });

  await selectAndCopy(eligible, {
    dir: cwd,
    repoRootAbs, // pass monorepo root explicitly
    message: 'Select files to copy:\n',
    totalLabel: 'files',
    defaultChecked,
    sort: false,
  });
}
