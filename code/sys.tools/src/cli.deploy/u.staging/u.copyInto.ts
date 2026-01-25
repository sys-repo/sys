import { Fs, Path } from '../common.ts';

/**
 * Copy `src` into `dst` (destination) using staging merge semantics.
 *
 * Semantics:
 * - Directories are always merged (never replaced).
 * - Files:
 *   - overwrite=false (default): existing files are preserved (skipped).
 *   - overwrite=true: last write wins.
 *
 * Note:
 *   Fs.copyDir cannot be used here:
 *   - force=false refuses existing targets
 *   - force=true deletes targets
 *   Staging requires merge semantics.
 */
export async function copyInto(args: {
  readonly src: string;
  readonly dst: string;
  readonly overwrite: boolean;
}): Promise<void> {
  const { src, dst, overwrite } = args;

  const copyFile = async (from: string, to: string): Promise<void> => {
    if (shouldExclude(Path.basename(from))) return;
    if (!overwrite && (await Fs.exists(to))) return;

    const res = await Fs.copyFile(from, to, { force: overwrite, throw: true });
    if (res?.error) throw res.error;
  };

  const mergeDir = async (fromDir: string, toDir: string): Promise<void> => {
    await Fs.ensureDir(toDir);

    for await (const entry of Deno.readDir(fromDir)) {
      if (shouldExclude(entry.name)) continue;
      const from = Fs.join(fromDir, entry.name);
      const to = Fs.join(toDir, entry.name);

      if (entry.isDirectory) {
        await mergeDir(from, to);
        continue;
      }

      if (entry.isFile) {
        await copyFile(from, to);
        continue;
      }

      // Ignore symlinks/others for now (keep staging deterministic).
    }
  };

  const info = await Deno.stat(src);
  if (info.isDirectory) {
    await mergeDir(src, dst);
    return;
  }

  await copyFile(src, dst);
}

/**
 * Helpers
 */
const EXCLUDE: readonly string[] = ['.DS_Store'];
function shouldExclude(name: string): boolean {
  return EXCLUDE.includes(name);
}
