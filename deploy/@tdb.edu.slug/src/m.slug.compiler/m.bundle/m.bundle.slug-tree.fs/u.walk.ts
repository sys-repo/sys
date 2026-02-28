import { type t, DEFAULT_IGNORE, Ignore } from './common.ts';

export async function readSlugTreeSourceFiles(args: {
  fs: t.SlugTreeFsRuntime;
  root: t.StringDir;
  ignore?: readonly string[];
}): Promise<readonly t.SlugBundleTransform.TreeFs.SourceFile[]> {
  const { fs } = args;
  const ignore = createIgnoreMatcher(args.ignore);
  const files: t.SlugBundleTransform.TreeFs.SourceFile[] = [];

  await collectDir(args.root);
  return files;

  async function collectDir(dir: string): Promise<void> {
    for await (const entry of walkDirLevel(fs, dir)) {
      const relPath = fs.relativePath(args.root, entry.path) as t.StringPath;
      if (isIgnored(relPath, ignore)) continue;

      if (entry.isDirectory) {
        await collectDir(entry.path);
        continue;
      }

      if (!entry.isFile || !isMarkdown(fs, entry.name)) continue;

      const res = await fs.readText(entry.path);
      const source = String(res.data ?? '');
      const rel = fs.relativePath(args.root, entry.path) as t.StringPath;
      files.push({ path: rel, source, name: entry.name });
    }
  }
}

export async function writeSlugTreeSourceDir(args: {
  fs: t.SlugTreeFsRuntime;
  root: t.StringDir;
  targetDir: t.StringDir;
  ignore?: readonly string[];
}): Promise<number> {
  const { fs } = args;
  const ignore = createIgnoreMatcher(args.ignore);
  let count = 0;

  await copyDirRecursive(args.root, args.targetDir);
  return count;

  async function copyDirRecursive(sourceDir: string, targetDir: string): Promise<void> {
    for await (const entry of walkDirLevel(fs, sourceDir)) {
      const relPath = fs.relativePath(args.root, entry.path) as t.StringPath;
      if (isIgnored(relPath, ignore)) continue;
      const target = fs.join(targetDir, entry.name);

      if (entry.isDirectory) {
        await copyDirRecursive(entry.path, target);
        continue;
      }

      if (!entry.isFile) continue;
      await fs.copyFile(entry.path, target, { force: true });
      count += 1;
    }
  }
}

/** Internal directory traversal helpers. */
async function* walkDirLevel(fs: t.SlugTreeFsRuntime, dir: string) {
  for await (const entry of fs.walk(dir, {
    maxDepth: 1,
    includeDirs: true,
    includeFiles: true,
    includeSymlinks: false,
    followSymlinks: false,
  })) {
    if (entry.path === dir) continue;
    yield entry;
  }
}

function createIgnoreMatcher(input?: readonly string[]): ReturnType<typeof Ignore.create> {
  const rules = Ignore.normalize([...DEFAULT_IGNORE, '.*', ...(input ?? [])]);
  return Ignore.create(rules);
}

function isIgnored(path: t.StringPath, ignore: ReturnType<typeof Ignore.create>): boolean {
  return ignore.isIgnored(path);
}

function isMarkdown(fs: t.SlugTreeFsRuntime, name: string): boolean {
  const ext = fs.extname(name).toLowerCase();
  return ext === '.md';
}
