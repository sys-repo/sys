import { Fs, Is, type t } from './common.ts';
import { GitInitMenu } from './u.menu.git.init.ts';

type CwdInput = t.StringDir | t.PiCli.Cwd;

export async function resolveCwd(input?: CwdInput): Promise<t.PiCli.CwdResolution> {
  if (isResolved(input)) return { kind: 'resolved', cwd: input };

  const invoked = input ?? Fs.cwd('terminal');
  const git = await findGitRoot(invoked);
  if (git) return { kind: 'resolved', cwd: { invoked, git } };

  const action = await GitInitMenu.prompt(invoked);
  if (action === 'exit') return { kind: 'exit' };

  const initialized = await GitInitMenu.init(invoked);
  if (!initialized.ok) {
    throw new Error(initialized.hint);
  }

  const resolved = await findGitRoot(invoked);
  if (resolved) return { kind: 'resolved', cwd: { invoked, git: resolved } };

  throw new Error(
    `Pi startup requires a git repository root. No .git ancestor found from ${invoked}`,
  );
}

/**
 * Resolve startup cwd and require a concrete git-rooted result.
 *
 * Use this from lower-level helpers that cannot represent an operator-selected
 * startup exit in their return type.
 */
export async function resolveCwdOrThrow(input?: CwdInput): Promise<t.PiCli.Cwd> {
  const resolved = await resolveCwd(input);
  if (resolved.kind === 'exit') throw new Error('Pi startup cancelled before launch.');
  return resolved.cwd;
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
