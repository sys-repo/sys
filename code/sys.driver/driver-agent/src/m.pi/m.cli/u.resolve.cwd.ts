import { Fs, Is, type t } from './common.ts';
import { bootstrapGitattributes } from './u.ensure.gitattributes.ts';
import { bootstrapGitignore, ensureGitignore } from './u.ensure.gitignore.ts';
import { GitInitMenu } from './u.menu.git.init.ts';

type CwdInput = t.StringDir | t.PiCli.Cwd;

export async function resolveCwd(
  input?: CwdInput,
  opts: t.PiCli.CwdResolveOptions = {},
): Promise<t.PiCli.CwdResolution> {
  if (isResolved(input)) return { kind: 'resolved', cwd: input };

  const invoked = input ?? Fs.cwd('process');
  const git = await resolveGitRoot(invoked, opts.gitRoot);
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

  const resolved = await resolveGitRoot(invoked, opts.gitRoot);
  if (resolved) {
    await bootstrapGitignore(resolved);
    await bootstrapGitattributes(resolved);
    return { kind: 'resolved', cwd: { invoked, git: resolved } };
  }

  throw new Error(
    `Pi startup requires a git repository root. No .git ancestor found from ${invoked}`,
  );
}

/**
 * Helpers:
 */
async function resolveGitRoot(dir: t.StringDir, mode: t.PiCli.GitRootMode = 'walk-up') {
  if (mode === 'cwd') return await isGitRoot(dir) ? dir : undefined;
  return await findGitRoot(dir);
}

async function findGitRoot(dir: t.StringDir) {
  return await Fs.findAncestor(dir, async ({ dir }) => (await isGitRoot(dir)) ? dir : undefined);
}

async function isGitRoot(dir: t.StringDir) {
  return await Fs.stat(Fs.join(dir, '.git'));
}

function isResolved(input?: CwdInput): input is t.PiCli.Cwd {
  return Is.object(input) && Is.string(input.invoked) && Is.string(input.git);
}
