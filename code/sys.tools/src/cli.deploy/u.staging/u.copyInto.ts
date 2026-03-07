import { Fs, Path } from '../common.ts';
import { shouldExclude } from '../u.exclude.ts';

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
  readonly sync?: boolean;
}): Promise<void> {
  const { src, dst, overwrite, sync = false } = args;

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
    if (sync) await pruneExtraFiles(src, dst);
    return;
  }

  await copyFile(src, dst);
}

async function pruneExtraFiles(srcDir: string, dstDir: string): Promise<void> {
  const srcFiles = await collectFiles(srcDir);
  const dstFiles = await collectFiles(dstDir);
  const srcSet = new Set(srcFiles.map((rel) => Fs.join(srcDir, rel)));

  for (const rel of dstFiles) {
    const abs = Fs.join(dstDir, rel);
    const srcAbs = Fs.join(srcDir, rel);
    if (srcSet.has(srcAbs)) continue;
    if (shouldExclude(Path.basename(abs))) continue;
    await Fs.remove(abs, { log: false });
  }
}

async function collectFiles(baseDir: string): Promise<string[]> {
  const files: string[] = [];

  const walk = async (dir: string): Promise<void> => {
    for await (const entry of Deno.readDir(dir)) {
      if (shouldExclude(entry.name)) continue;
      const abs = Fs.join(dir, entry.name);

      if (entry.isDirectory) {
        await walk(abs);
        continue;
      }

      if (!entry.isFile) continue;
      files.push(Path.relative(baseDir, abs));
    }
  };

  await walk(baseDir);
  return files;
}
