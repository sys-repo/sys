import { type t, DEFAULT_IGNORE, Fs } from './common.ts';

export async function readSlugTreeSourceFiles(args: {
  root: t.StringDir;
  include?: readonly string[];
  ignore?: readonly string[];
}): Promise<readonly t.SlugBundleTransform.TreeFs.SourceFile[]> {
  const include = (args.include ?? ['.md']).map((ext) => ext.toLowerCase());
  const ignore = new Set([...DEFAULT_IGNORE, ...(args.ignore ?? [])]);
  const files: t.SlugBundleTransform.TreeFs.SourceFile[] = [];

  await walkDir(args.root);
  return files;

  async function walkDir(dir: string): Promise<void> {
    for await (const entry of readDirLevel(dir)) {
      if (isIgnored(entry.name, ignore)) continue;

      if (entry.isDirectory) {
        await walkDir(entry.path);
        continue;
      }

      if (!entry.isFile || !isIncluded(entry.name, include)) continue;

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
  include?: readonly string[];
  ignore?: readonly string[];
}): Promise<number> {
  const include = (args.include ?? ['.md']).map((ext) => ext.toLowerCase());
  const ignore = new Set([...DEFAULT_IGNORE, ...(args.ignore ?? [])]);
  let count = 0;

  await copyDir(args.root, args.targetDir);
  return count;

  async function copyDir(sourceDir: string, targetDir: string): Promise<void> {
    for await (const entry of readDirLevel(sourceDir)) {
      if (isIgnored(entry.name, ignore)) continue;
      const target = Fs.join(targetDir, entry.name);

      if (entry.isDirectory) {
        await copyDir(entry.path, target);
        continue;
      }

      if (!entry.isFile || !isIncluded(entry.name, include)) continue;
      await Fs.copyFile(entry.path, target, { force: true });
      count += 1;
    }
  }
}

async function* readDirLevel(dir: string) {
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

function isIgnored(name: string, ignore: Set<string>): boolean {
  if (name.startsWith('.')) return true;
  return ignore.has(name);
}

function isIncluded(name: string, include: readonly string[]): boolean {
  const ext = Fs.extname(name).toLowerCase();
  return include.includes(ext);
}
