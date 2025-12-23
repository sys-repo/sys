import { Fmt } from '../u.fmt.ts';
import { type t, Cli, Fs } from './common.ts';

/**
 * Entry-gate normalization for a configuration file.
 */
export async function prepare(cwd: t.StringDir, filename: string, toolname: string) {
  cwd = cwd ?? Fs.cwd('terminal');
  const path = Fs.join(cwd, filename);

  if (!(await Fs.exists(path))) {
    console.info(Fmt.Prereqs.folderNotConfigured(cwd, toolname));
    const yes = await Cli.Input.Confirm.prompt({ message: `Create config file now?` });
    if (!yes) Deno.exit(0);
  }

  return { path };
}
