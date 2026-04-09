import { PiCli } from '@sys/driver-agent/pi/cli';
import { Fs } from '@sys/fs';
import { Path } from '@sys/std';

const cwd = Fs.cwd('terminal');
const gitRoot = await findGitRoot(cwd);

await PiCli.main({
  argv: Deno.args,
  cwd,
  read: [...(await resolveTaskReadScope(gitRoot))],
});

/**
 * Helpers:
 */
async function resolveTaskReadScope(gitRoot: string | undefined) {
  if (!gitRoot) return [];

  const sysCanon = Path.join(Path.dirname(gitRoot), 'sys.canon');
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
