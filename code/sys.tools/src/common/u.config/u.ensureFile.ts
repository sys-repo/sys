import { type t, Fs, Cli } from './common.ts';
import { getPath } from './u.path.ts';
import { normalizePath } from './u.normalizePath.ts';

/**
 * Ensure a config file exists.
 *
 * If missing, prompts the user to create it.
 * Exits the process if declined.
 */
export async function ensureFile(
  cwd: t.StringDir,
  filename: string,
  opts?: { prompt?: string },
): Promise<void> {
  const path = getPath(cwd, filename);

  {
    // TEMP 🐷
    const cwdResolved = cwd ?? Fs.cwd('terminal');
    const canonical = getPath(cwdResolved, filename);
    const rootLevel = getPath(cwdResolved, filename, { subdir: '' });

    console.info(
      'cwd arg:',
      cwd,
      'cwdResolved:',
      cwdResolved,
      'Deno.cwd():',
      Deno.cwd(),
      'filename:',
      filename,
      'canonical:',
      canonical,
      'canonical.exists:',
      await Fs.exists(canonical),
      'rootLevel:',
      rootLevel,
      'rootLevel.exists:',
      await Fs.exists(rootLevel),
    );
  }

  await normalizePath(cwd, filename);
  if (await Fs.exists(path)) return;

  const message = opts?.prompt ?? 'Create config file now?';
  const yes = await Cli.Input.Confirm.prompt({ message });

  if (!yes) Deno.exit(0);
}
