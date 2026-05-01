import { Fs } from '@sys/fs';
import { Path } from '@sys/std/path';
import type { t } from '../src/common.ts';

export const TaskCli = {
  async input(argv: readonly string[] = []) {
    const cwd = Fs.cwd('terminal');
    const gitRoot = await findGitRoot(cwd);

    return {
      argv,
      cwd,
      read: await resolveReadScope(gitRoot),
    };
  },
} as const;

/**
 * Helpers:
 */
async function resolveReadScope(gitRoot: string | undefined): Promise<t.StringPath[]> {
  if (!gitRoot) return [];

  const sysCanon = Path.join(Path.dirname(gitRoot), 'sys.canon') as t.StringPath;
  if (!(await Fs.exists(sysCanon))) return [];
  return [sysCanon];
}

async function findGitRoot(dir: string): Promise<string | undefined> {
  let found: string | undefined;
  await Fs.walkUp(dir, async ({ dir, stop }) => {
    if (!(await Fs.exists(Path.join(dir, '.git')))) return;
    found = dir;
    stop();
  });
  return found;
}
