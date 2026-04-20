import { Fs, Is, type t } from './common.ts';

type CwdInput = t.StringDir | t.PiCli.Cwd;

export async function resolveCwd(input?: CwdInput): Promise<t.PiCli.Cwd> {
  if (isResolved(input)) return input;

  const invoked = input ?? Fs.cwd('terminal');
  const git = await Fs.findAncestor<t.StringDir>(invoked, async ({ dir }) => {
    return (await Fs.stat(Fs.join(dir, '.git'))) ? dir : undefined;
  });

  if (git) return { invoked, git };

  throw new Error(
    `Pi startup requires a git repository root. No .git ancestor found from ${invoked}`,
  );
}

function isResolved(input?: CwdInput): input is t.PiCli.Cwd {
  return Is.object(input) && Is.string(input.invoked) && Is.string(input.git);
}
