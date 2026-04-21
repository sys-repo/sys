import { Fs, Is, type t } from './common.ts';
import { ensureGitignore } from './u.ensure.gitignore.ts';
import { GitInitMenu } from './u.menu.git.init.ts';

type CwdInput = t.StringDir | t.PiCli.Cwd;

export async function resolveCwd(input?: CwdInput): Promise<t.PiCli.CwdResolution> {
  if (isResolved(input)) return { kind: 'resolved', cwd: input };

  const invoked = input ?? Fs.cwd('terminal');
  const git = await findGitRoot(invoked);
  if (git) {
    await ensureGitignore(git);
    return { kind: 'resolved', cwd: { invoked, git } };
  }

  const action = await GitInitMenu.prompt(invoked);
  if (action === 'exit') return { kind: 'exit' };

  const initialized = await GitInitMenu.init(invoked);
  if (!initialized.ok) {
    throw new Error(initialized.hint);
  }

  const resolved = await findGitRoot(invoked);
  if (resolved) {
    await ensureGitignore(resolved);
    return { kind: 'resolved', cwd: { invoked, git: resolved } };
  }

  throw new Error(
    `Pi startup requires a git repository root. No .git ancestor found from ${invoked}`,
  );
}

/**
 * Helpers:
 */
async function findGitRoot(dir: t.StringDir) {
  const isGit = async (dir: string) => await Fs.stat(Fs.join(dir, '.git'));
  return await Fs.findAncestor(dir, async ({ dir }) => (await isGit(dir)) ? dir : undefined);
}

function isResolved(input?: CwdInput): input is t.PiCli.Cwd {
  return Is.object(input) && Is.string(input.invoked) && Is.string(input.git);
}
