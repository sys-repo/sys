import { Cli } from '@sys/cli';
import { Fs } from '@sys/fs';
import { type WalkEntry } from '@sys/fs/t';
import { selectAndCopy } from './Task.-copy.u.ts';

type CopyMode = 'types' | 'files:select' | 'files:all' | 'files:deno.json';
const exclude = ['**/node_modules/', '**/.git/', '**/dist/', '.DS_Store', '**/.tmp/', '**/-tmp/'];

/**
 * Sub-command: Copy Files ("src" code).
 */
export async function copyFiles(
  options: { initial?: 'none' | 'all'; filter?: (file: WalkEntry) => boolean } = {},
) {
  const { initial = 'all' } = options;
  const dir = Fs.cwd('terminal');
  const glob = Fs.glob(dir, { exclude, includeDirs: false });
  const paths = (await glob.find('**'))
    .filter((file) => options.filter?.(file) ?? true)
    .map((file) => file.path);

  const defaultChecked = (path: string) => {
    return initial === 'all';
    return false;
    if (path.includes('.test.')) return false;
    if (path.includes('-SPEC.')) return false;
    if (path.includes('-spec/')) return false;
    return true;
  };

  const eligible = paths.filter((path) => {
    const ext = Fs.extname(path);
    return ['.ts', '.tsx', '.md', '.yaml', '.json'].includes(ext);
  });

  await selectAndCopy(eligible, {
    dir,
    message: 'Select files to copy:\n',
    totalLabel: 'files',
    defaultChecked,
    sort: false,
  });
}

/**
 * Sub-command: Copy Types
 */
export async function copyTypes(options: { initial?: 'none' | 'all' } = {}) {
  const { initial = 'all' } = options;
  const dir = Fs.cwd('terminal');

  /**
   * Filenames used for consolidated type surfaces in the repo:
   *     - t.ts
   *     - t.<segment>.ts
   *     - t.<segment>.<segment>.ts
   * This helper matches those basenames exactly, keeping the intent obvious.
   */
  const isTypesFile = (path: string) => {
    const base = Fs.basename(path);
    return /^t(?:\.[A-Za-z0-9_-]+)*\.ts$/.test(base);
  };

  // Gather all non-directory entries, then filter to type files by basename rule.
  const glob = Fs.glob(dir, { exclude, includeDirs: false });
  const allPaths = (await glob.find('**')).map((f) => f.path);
  const paths = allPaths.filter(isTypesFile);

  const defaultChecked = (_path: string) => {
    return initial === 'all';
  };
  await selectAndCopy(paths, {
    dir,
    message: 'Select type files to copy:\n',
    totalLabel: 'type files',
    defaultChecked,
    sort: true,
  });
}

/**
 * Sub-command: Copy deno.json files
 */
export async function copyDenoFiles(options: { initial?: 'none' | 'all' }) {
  const { initial = 'all' } = options;
  await copyFiles({ initial, filter: (file) => file.name === 'deno.json' });
}

/**
 * Entry-point: prompt for which copy mode to run.
 */
export async function run() {
  const mode = (await Cli.Prompt.Select.prompt<CopyMode>({
    message: 'Select copy mode:\n',
    options: [
      { name: 'Copy Types', value: 'types' as const },
      { name: 'Copy Files (select)', value: 'files:select' as const },
      { name: 'Copy Files (all)', value: 'files:all' as const },
      { name: 'Copy Files: deno.json', value: 'files:deno.json' as const },
    ],
  })) as CopyMode;

  if (mode === 'files:select') await copyFiles({ initial: 'none' });
  else if (mode === 'files:all') await copyFiles({ initial: 'all' });
  else if (mode === 'types') await copyTypes({ initial: 'all' });
  else if (mode === 'files:deno.json') await copyDenoFiles({});
}

// Execute by default when run as a script.
await run();
