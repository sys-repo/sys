import { type t, c, Fs, Json, Schema, SlugBundle, SlugTree } from './common.ts';
import { clearTargetDir, prepareTargetDir } from './u.dir.ts';
import { deriveAssetsPath, normalizeTargetDirs, normalizeTargets, toDocid } from './u.target.ts';
import { readSlugTreeSourceFiles, writeSlugTreeSourceDir } from './u.walk.ts';

export async function bundleSlugTreeFs(args: {
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
      fileContent = await writeSlugTreeSha256Dir({
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

/**
 * Helpers
 */
async function writeSlugTreeSha256Dir(args: {
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
