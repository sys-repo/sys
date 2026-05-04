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
  const root = await resolveRoot(invoked, opts.gitRoot);
  if (root) {
    if (root.git) await ensureGitignore(root.git);
    return { kind: 'resolved', cwd: { invoked, ...root } };
  }

  if (opts.interactive === false) {
    const err = `Pi startup requires a git repository root. No .git ancestor found from ${invoked}`;
    throw new Error(err);
  }

  const action = await GitInitMenu.prompt(invoked);
  if (action === 'exit') return { kind: 'exit' };

  const initialized = await GitInitMenu.init(invoked);
  if (!initialized.ok) {
    throw new Error(initialized.hint);
  }

  const resolved = await resolveRoot(invoked, opts.gitRoot);
  if (resolved?.git) {
    await bootstrapGitignore(resolved.git);
    await bootstrapGitattributes(resolved.git);
    return { kind: 'resolved', cwd: { invoked, ...resolved } };
  }

  throw new Error(
    `Pi startup requires a git repository root. No .git ancestor found from ${invoked}`,
  );
}

/**
 * Helpers:
 */
async function resolveRoot(
  dir: t.StringDir,
  mode: t.PiCli.GitRootMode = 'walk-up',
): Promise<{ readonly root?: t.StringDir; readonly git?: t.StringDir } | undefined> {
  if (mode === 'none') return { root: dir };
  if (mode === 'cwd') return await isGitRoot(dir) ? { git: dir } : undefined;
  const git = await findGitRoot(dir);
  return git ? { git } : undefined;
}

async function findGitRoot(dir: t.StringDir) {
  return await Fs.findAncestor(dir, async ({ dir }) => (await isGitRoot(dir)) ? dir : undefined);
}

async function isGitRoot(dir: t.StringDir) {
  return await Fs.stat(Fs.join(dir, '.git'));
}

function isResolved(input?: CwdInput): input is t.PiCli.Cwd {
  return Is.object(input) && Is.string(input.invoked) && (Is.string(input.root) || Is.string(input.git));
}
