import { Cli } from '@sys/cli';
import { Fs } from '@sys/fs';
import { type WalkEntry } from '@sys/fs/t';
import { selectAndCopy } from './Task.-copy.u.ts';

type CopyMode = 'types' | 'files:select' | 'files:all' | 'files:deno.json';

const exclude = [
  '**/node_modules/',
  '**/.git/',
  '**/dist/',
  '**/.tmp/',
  '**/-tmp/',
  '**/.DS_Store',
];

/**
 * Resolve the monorepo root.
 * Preference: VCS root ('.git'), otherwise topmost ancestor containing 'deno.json'.
 */
async function detectRepoRoot(startDir: string): Promise<string> {
  let curr = Fs.Path.resolve(startDir);
  let topmostWithDeno: string | undefined;

  while (true) {
    const gitDir = Fs.Path.join(curr, '.git');
    if (await Fs.exists(gitDir)) return curr;

    const denoJson = Fs.Path.join(curr, 'deno.json');
    if (await Fs.exists(denoJson)) topmostWithDeno = curr;

    const parent = Fs.Path.dirname(curr);
    if (parent === curr) return topmostWithDeno ?? Fs.Path.resolve(startDir);
    curr = parent;
  }
}

/**
 * Sub-command: Copy Files ("src" code).
 */
export async function copyFiles(
  options: { initial?: 'none' | 'all'; filter?: (file: WalkEntry) => boolean } = {},
) {
  const { initial = 'all' } = options;

  const dir = Fs.cwd('terminal'); // package working dir
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

/**
 * Sub-command: Copy Types
 */
export async function copyTypes(options: { initial?: 'none' | 'all' } = {}) {
  const { initial = 'all' } = options;

  const dir = Fs.cwd('terminal');
  const repoRootAbs = await detectRepoRoot(dir);

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

  const glob = Fs.glob(dir, { exclude, includeDirs: false });
  const allPaths = (await glob.find('**')).map((f) => f.path);
  const paths = allPaths.filter(isTypesFile);

  const defaultChecked = () => initial === 'all';

  await selectAndCopy(paths, {
    dir,
    repoRootAbs, // pass through
    message: 'Select type files to copy:\n',
    totalLabel: 'type files',
    defaultChecked,
    sort: true,
  });
}

/**
 * Sub-command: Copy deno.json files
 */
export async function copyDenoFiles(options: { initial?: 'none' | 'all' } = {}) {
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
      { name: 'Copy Files (select)', value: 'files:select' as const },
      { name: 'Copy Files (all)', value: 'files:all' as const },
      { name: 'Copy Types', value: 'types' as const },
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
