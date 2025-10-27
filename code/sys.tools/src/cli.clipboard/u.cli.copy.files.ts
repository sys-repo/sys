import { type t, detectRepoRoot, exclude, Fs } from './common.ts';
import { selectAndCopy } from './u.copy.ts';

/**
 * Sub-command: Copy Files ("src" code).
 */
export async function copyFiles(
  dir: t.StringDir,
  options: { initial?: 'none' | 'all'; filter?: (file: t.WalkEntry) => boolean } = {},
) {
  const { initial = 'all' } = options;
  const repoRootAbs = await detectRepoRoot(dir); // monorepo root (stable anchor)

  const glob = Fs.glob(dir, { exclude, includeDirs: false });
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
    dir,
    repoRootAbs, // pass monorepo root explicitly
    message: 'Select files to copy:\n',
    totalLabel: 'files',
    defaultChecked,
    sort: false,
  });
}
