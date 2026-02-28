import { type t, c, DEFAULT_IGNORE } from './common.ts';

export async function prepareTargetDir(args: {
  fs: t.SlugTreeFsRuntime;
  targetDir: t.StringDir;
  onWarning?: (message: string) => void;
}): Promise<boolean> {
  const { fs, targetDir, onWarning } = args;
  const warn = (message: string) => {
    if (onWarning) onWarning(message);
    else console.info(c.yellow(message));
  };

  const exists = await fs.exists(targetDir);
  if (!exists) {
    await fs.ensureDir(targetDir);
    return true;
  }

  const info = await fs.stat(targetDir);
  if (!info) {
    warn(`warning: bundle:slug-tree:fs target.dir stat unavailable: ${targetDir}`);
    return false;
  }

  if (info.isDirectory) return true;

  if (info.isFile) {
    warn(`warning: bundle:slug-tree:fs target.dir is a file: ${targetDir}`);
    return false;
  }

  warn(`warning: bundle:slug-tree:fs target.dir is not a directory: ${targetDir}`);
  return false;
}

export async function clearTargetDir(args: {
  fs: t.SlugTreeFsRuntime;
  targetDir: t.StringDir;
}): Promise<void> {
  const { fs, targetDir } = args;
  const preserve = new Set<string>(DEFAULT_IGNORE as readonly string[]);
  for await (const entry of fs.walk(targetDir, {
    maxDepth: 1,
    includeDirs: true,
    includeFiles: true,
    includeSymlinks: true,
    followSymlinks: false,
  })) {
    if (entry.path === targetDir) continue;
    if (preserve.has(entry.name)) continue;
    await fs.remove(entry.path, { log: false });
  }
}
