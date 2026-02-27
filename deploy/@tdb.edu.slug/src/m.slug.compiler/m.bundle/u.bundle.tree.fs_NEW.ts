import { SlugTree } from '../m.slug.SlugTree/mod.ts';
import { type t, c, DEFAULT_IGNORE, Fs, Json, Schema, SlugBundle } from './common.ts';

export async function runSlugTreeFs_NEW(args: {
  cwd: t.StringDir;
  config: t.SlugBundleFileTree;
}): Promise<t.SlugBundleFileTreeStats | undefined> {
  const startedAt = Date.now();
  const { cwd, config } = args;

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
    { root, createCrdt: async () => 'crdt:tbd' as t.StringRef },
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
  let fileContent: t.SlugBundleTransform.TreeFs.FileContentDerived | undefined;
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
      fileContent = await writeSlugTreeSha256DirFromTransform({
        root,
        targetDir: targetDir.path,
        include,
        ignore,
        includePath,
        docid: toDocid(config.docid),
        manifests: targets.map((t) => t.path),
      });
      sha256Files += fileContent.sha256.length;
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
      if (assetsPath && fileContent && fileContent.entries.length > 0) {
        if (!fileContent.index) {
          console.info(
            c.yellow(
              'warning: bundle:slug-tree:fs skipped assets index (docid unresolved for this bundle). Fix the `slug-tree:fs` config by adding `docid: <id>` at the bundle root (same level as `kind`, `source`, `target`), or rename the JSON manifest target to `slug-tree.<docid>.json`.',
            ),
          );
          continue;
        }
        await Fs.ensureDir(Fs.dirname(assetsPath));
        await Fs.write(assetsPath, Json.stringify(fileContent.index));
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

async function writeSlugTreeSha256DirFromTransform(args: {
  root: t.StringDir;
  targetDir: t.StringDir;
  include?: readonly string[];
  ignore?: readonly string[];
  includePath?: boolean;
  docid?: t.StringId;
  manifests?: readonly t.StringPath[];
}): Promise<t.SlugBundleTransform.TreeFs.FileContentDerived> {
  const files = await readSlugTreeSourceFiles({
    root: args.root,
    include: args.include,
    ignore: args.ignore,
  });

  const derived = await SlugBundle.Transform.TreeFs.derive({
    files,
    includePath: args.includePath,
    docid: args.docid,
    manifests: args.manifests,
  });

  if (!derived.ok) throw derived.error;

  for (const item of derived.value.sha256) {
    const outPath = Fs.join(args.targetDir, item.filename);
    await Fs.write(outPath, Json.stringify(item.doc));
  }

  return derived.value;
}

async function readSlugTreeSourceFiles(args: {
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
    for await (const entry of Deno.readDir(dir)) {
      if (isIgnored(entry.name, ignore)) continue;
      const abs = Fs.join(dir, entry.name);

      if (entry.isDirectory) {
        await walkDir(abs);
        continue;
      }

      if (!entry.isFile || !isIncluded(entry.name, include)) continue;

      const res = await Fs.readText(abs);
      const source = String(res.data ?? '');
      const rel = Fs.Path.relative(args.root, abs) as t.StringPath;
      files.push({ path: rel, source, name: entry.name });
    }
  }
}

function toDocid(input?: t.StringId): t.StringId | undefined {
  const value = String(input ?? '').trim();
  return value ? (value as t.StringId) : undefined;
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
