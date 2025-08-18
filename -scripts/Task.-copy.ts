import { Cli } from '@sys/cli';
import { Fs } from '@sys/fs';
import { selectAndCopy } from './Task.-copy.u.ts';

type CopyMode = 'types' | 'files';

/**
 * Sub-command: Copy Files ("src" code).
 */
export async function copyFiles() {
  const dir = Fs.cwd('terminal');
  const paths = (await Fs.glob(dir).find('**', { includeDirs: false })).map((file) => file.path);

  const defaultChecked = (path: string) => {
    return false;
    if (path.includes('.test.')) return false;
    if (path.includes('-SPEC.')) return false;
    if (path.includes('-spec/')) return false;
    return true;
  };

  const eligible = paths.filter((path) => {
    const ext = Fs.extname(path);
    return ['.ts', '.tsx', '.md', '.yaml'].includes(ext);
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
export async function copyTypes() {
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
  const allPaths = (await Fs.glob(dir).find('**', { includeDirs: false })).map((f) => f.path);
  const paths = allPaths.filter(isTypesFile);

  const defaultChecked = (_path: string) => true;
  await selectAndCopy(paths, {
    dir,
    message: 'Select type files to copy:\n',
    totalLabel: 'type files',
    defaultChecked,
    sort: true,
  });
}

/**
 * Entry-point: prompt for which copy mode to run.
 */
export async function run() {
  const mode = await Cli.Prompt.Select.prompt<CopyMode>({
    message: 'Select copy mode:\n',
    options: [
      { name: 'Copy Types', value: 'types' as const },
      { name: 'Copy Files (src)', value: 'files' as const },
    ],
  });

  if (mode === 'files') await copyFiles();
  else if (mode === 'types') await copyTypes();
}

// Execute by default when run as a script.
await run();
