import { type t, c, DEFAULT_IGNORE, Fs } from './common.ts';

export async function prepareTargetDir(targetDir: t.StringDir): Promise<boolean> {
  const exists = await Fs.exists(targetDir);
  if (!exists) {
    await Fs.ensureDir(targetDir);
    return true;
  }

  const info = await Fs.stat(targetDir);
  if (!info) {
    console.info(c.yellow(`warning: bundle:slug-tree:fs target.dir stat unavailable: ${targetDir}`));
    return false;
  }

  if (info.isDirectory) return true;

  if (info.isFile) {
    console.info(c.yellow(`warning: bundle:slug-tree:fs target.dir is a file: ${targetDir}`));
    return false;
  }

  console.info(
    c.yellow(`warning: bundle:slug-tree:fs target.dir is not a directory: ${targetDir}`),
  );
  return false;
}

export async function clearTargetDir(targetDir: t.StringDir): Promise<void> {
  const preserve = new Set<string>(DEFAULT_IGNORE as readonly string[]);
  for await (const entry of Fs.walk(targetDir, {
    maxDepth: 1,
    includeDirs: true,
    includeFiles: true,
    includeSymlinks: true,
    followSymlinks: false,
  })) {
    if (entry.path === targetDir) continue;
    if (preserve.has(entry.name)) continue;
    await Fs.remove(entry.path, { log: false });
  }
}
