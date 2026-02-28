import { type t, DEFAULT_IGNORE, Fs, Ignore } from './common.ts';

export async function readSlugTreeSourceFiles(args: {
  root: t.StringDir;
  ignore?: readonly string[];
}): Promise<readonly t.SlugBundleTransform.TreeFs.SourceFile[]> {
  const ignore = createIgnoreMatcher(args.ignore);
  const files: t.SlugBundleTransform.TreeFs.SourceFile[] = [];

  await collectDir(args.root);
  return files;

  async function collectDir(dir: string): Promise<void> {
    for await (const entry of walkDirLevel(dir)) {
      const relPath = Fs.Path.relative(args.root, entry.path) as t.StringPath;
      if (isIgnored(relPath, ignore)) continue;

      if (entry.isDirectory) {
        await collectDir(entry.path);
        continue;
      }

      if (!entry.isFile || !isMarkdown(entry.name)) continue;

      const res = await Fs.readText(entry.path);
      const source = String(res.data ?? '');
      const rel = Fs.Path.relative(args.root, entry.path) as t.StringPath;
      files.push({ path: rel, source, name: entry.name });
    }
  }
}

export async function writeSlugTreeSourceDir(args: {
  root: t.StringDir;
  targetDir: t.StringDir;
  ignore?: readonly string[];
}): Promise<number> {
  const ignore = createIgnoreMatcher(args.ignore);
  let count = 0;

  await copyDirRecursive(args.root, args.targetDir);
  return count;

  async function copyDirRecursive(sourceDir: string, targetDir: string): Promise<void> {
    for await (const entry of walkDirLevel(sourceDir)) {
      const relPath = Fs.Path.relative(args.root, entry.path) as t.StringPath;
      if (isIgnored(relPath, ignore)) continue;
      const target = Fs.join(targetDir, entry.name);

      if (entry.isDirectory) {
        await copyDirRecursive(entry.path, target);
        continue;
      }

      if (!entry.isFile) continue;
      await Fs.copyFile(entry.path, target, { force: true });
      count += 1;
    }
  }
}

/** Internal directory traversal helpers. */
async function* walkDirLevel(dir: string) {
  for await (const entry of Fs.walk(dir, {
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

function isMarkdown(name: string): boolean {
  const ext = Fs.extname(name).toLowerCase();
  return ext === '.md';
}
