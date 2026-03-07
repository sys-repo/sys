import { type t, detectRepoRoot, EXCLUDE, Fs } from './common.ts';
import { selectAndCopy } from './u.copy.ts';

/**
 * Sub-command: Copy Types
 */
export async function copyTypes(cwd: t.StringDir, options: { initial?: 'none' | 'all' } = {}) {
  const { initial = 'all' } = options;
  const repoRootAbs = await detectRepoRoot(cwd);

  /**
   * Filenames used for consolidated type surfaces in the repo:
   *   - t.ts
   *   - t.<segment>.ts
   *   - t.<segment>.<segment>.ts
   */
  const isTypesFile = (path: string) => {
    const base = Fs.basename(path);
    return /^t(?:\.[A-Za-z0-9_-]+)*\.ts$/.test(base);
  };

  const glob = Fs.glob(cwd, { exclude: EXCLUDE, includeDirs: false });
  const allPaths = (await glob.find('**')).map((f) => f.path);
  const paths = allPaths.filter(isTypesFile);

  const defaultChecked = () => initial === 'all';

  await selectAndCopy(paths, {
    dir: cwd,
    repoRootAbs, // pass through
    message: 'Select type files to copy:\n',
    totalLabel: 'type files',
    defaultChecked,
    sort: true,
  });
}
