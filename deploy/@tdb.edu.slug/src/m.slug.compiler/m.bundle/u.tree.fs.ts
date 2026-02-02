import { SlugTree } from '../m.slug.SlugTree/mod.ts';
import { type t, c, DEFAULT_IGNORE, Fs, Json, Schema } from './common.ts';
import { writeSlugFileContentIndex, writeSlugTreeSha256Dir } from './u.tree.fs.file.ts';

export async function runSlugTreeFs(args: {
  cwd: t.StringDir;
  config: t.SlugBundleFileTree;
  createCrdt: () => Promise<t.StringRef>;
}): Promise<t.SlugBundleFileTreeStats | undefined> {
  const startedAt = Date.now();
  const { cwd, createCrdt, config } = args;

  const source = Fs.Tilde.expand(String(config.source ?? '.'));
  const root = Fs.Path.resolve(cwd, source || '.');

  const targets = normalizeTargets(config.target?.manifests).map((target) => ({
    raw: target,
    path: Fs.Path.resolve(cwd, Fs.Tilde.expand(String(target))),
  }));
  const targetDirs = normalizeTargetDirs(config.target?.dir).map((item) => ({
    kind: item.kind,
    path: Fs.Path.resolve(cwd, Fs.Tilde.expand(String(item.path))),
  }));

  if (targets.length === 0 && targetDirs.length === 0) {
    console.info(c.yellow('warning: bundle:slug-tree:fs skipped (no target configured)'));
    return;
  }

  const include = config.include ? [...config.include] : undefined;
  const ignore = config.ignore ? [...config.ignore] : undefined;

  const treeDoc = await SlugTree.fromDir(
    { root, createCrdt },
    {
      include,
      ignore,
      sort: config.sort,
      readmeAsIndex: config.readmeAsIndex,
    },
  );
  const treeOk = Schema.Value.Check(SlugTree.Schema.Props, treeDoc);
  if (!treeOk) {
    throw new Error('Slug-tree manifest failed schema validation.');
  }

  const includePath = targetDirs.some((item) => item.kind === 'source');
  const docid = config.crdt.docid;
  let fileEntries: t.SlugFileContentEntry[] = [];
  let sourceFiles = 0;
  let sha256Files = 0;
  let manifests = 0;
  for (const targetDir of targetDirs) {
    const ok = await prepareTargetDir(targetDir.path);
    if (!ok) continue;
    await clearTargetDir(targetDir.path);
    if (targetDir.kind === 'source') {
      sourceFiles += await writeSlugTreeSourceDir({
        root,
        targetDir: targetDir.path,
        include,
        ignore,
      });
      continue;
    }
    if (targetDir.kind === 'sha256') {
      fileEntries = await writeSlugTreeSha256Dir({
        root,
        targetDir: targetDir.path,
        include,
        ignore,
        includePath,
      });
      sha256Files += fileEntries.length;
      continue;
    }
    console.info(
      c.yellow(
        `warning: bundle:slug-tree:fs skipped unsupported target.dir kind: ${targetDir.kind}`,
      ),
    );
  }

  for (const target of targets) {
    const ext = Fs.extname(target.path).toLowerCase();
    const dir = Fs.dirname(target.path);
    await Fs.ensureDir(dir);
    if (ext === '.json') {
      await Fs.write(target.path, Json.stringify(treeDoc));
      manifests += 1;
      const assetsPath = deriveAssetsPath(target.path);
      if (assetsPath && fileEntries.length > 0) {
        await writeSlugFileContentIndex({
          targetPath: assetsPath,
          docid: docid as t.StringId,
          entries: fileEntries,
        });
        manifests += 1;
      }
      continue;
    }
    if (ext === '.yaml' || ext === '.yml') {
      await Fs.write(target.path, SlugTree.toYaml(treeDoc));
      manifests += 1;
      continue;
    }
    console.info(
      c.yellow(`warning: bundle:slug-tree:fs skipped unsupported target: ${target.raw}`),
    );
  }

  const elapsed = Date.now() - startedAt;
  const files = sourceFiles > 0 ? sourceFiles : sha256Files;
  return { files, sourceFiles, sha256Files, manifests, elapsed };
}

function normalizeTargets(input?: t.StringPath | readonly t.StringPath[]): t.StringPath[] {
  if (!input) return [];
  const list = Array.isArray(input) ? input : [input];
  return list.map((value) => String(value).trim()).filter(Boolean) as t.StringPath[];
}

function normalizeTargetDirs(
  input?: t.StringPath | t.SlugBundleFileTreeTargetDir | readonly t.SlugBundleFileTreeTargetDir[],
): t.SlugBundleFileTreeTargetDir[] {
  if (!input) return [];
  if (typeof input === 'string') return [{ kind: 'source', path: input }];
  if (Array.isArray(input)) return input.filter(Boolean) as t.SlugBundleFileTreeTargetDir[];
  return [input as t.SlugBundleFileTreeTargetDir];
}

function deriveAssetsPath(path: t.StringFile): t.StringFile | undefined {
  const ext = Fs.extname(path).toLowerCase();
  if (ext !== '.json') return;
  const dir = Fs.dirname(path);
  const base = Fs.basename(path, ext);
  return Fs.join(dir, `${base}.assets${ext}`) as t.StringFile;
}

async function writeSlugTreeSourceDir(args: {
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
    for await (const entry of Deno.readDir(sourceDir)) {
      if (isIgnored(entry.name, ignore)) continue;
      const source = Fs.join(sourceDir, entry.name);
      const target = Fs.join(targetDir, entry.name);

      if (entry.isDirectory) {
        await copyDir(source, target);
        continue;
      }

      if (!entry.isFile || !isIncluded(entry.name, include)) continue;
      await Fs.copyFile(source, target, { force: true });
      count += 1;
    }
  }
}

async function prepareTargetDir(targetDir: t.StringDir): Promise<boolean> {
  const exists = await Fs.exists(targetDir);
  if (!exists) {
    await Fs.ensureDir(targetDir);
    return true;
  }

  const info = await Deno.stat(targetDir);
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

async function clearTargetDir(targetDir: t.StringDir): Promise<void> {
  const preserve = new Set<string>(DEFAULT_IGNORE as readonly string[]);
  for await (const entry of Deno.readDir(targetDir)) {
    if (preserve.has(entry.name)) continue;
    const target = Fs.join(targetDir, entry.name);
    await Fs.remove(target, { log: false });
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
