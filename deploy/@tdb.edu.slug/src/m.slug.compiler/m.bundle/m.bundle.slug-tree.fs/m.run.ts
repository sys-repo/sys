import { type t, c, Fs, FsCapability, Json, Schema, SlugBundle, SlugTree } from './common.ts';
import { clearTargetDir, prepareTargetDir } from './u.dir.ts';
import { normalizeTargetDirs } from './u.target.ts';
import { readSlugTreeSourceFiles, writeSlugTreeSourceDir } from './u.walk.ts';

export async function bundleSlugTreeFs(args: {
  cwd: t.StringDir;
  config: t.SlugBundleFileTree;
  onWarning?: (message: string) => void;
  fs?: t.SlugTreeFsRuntime;
}): Promise<t.SlugBundleFileTreeStats | undefined> {
  const startedAt = Date.now();
  const { cwd, config, onWarning } = args;
  const fs = args.fs ?? FsCapability.fromFs(Fs);
  const warn = (message: string) => {
    if (onWarning) onWarning(message);
    else console.info(c.yellow(message));
  };

  const source = String(config.source ?? '.');
  const root = fs.resolve(cwd, source || '.', { expandTilde: true });

  const targets = SlugBundle.Transform.TreeFs.normalizeManifestTargets(config.target?.manifests).map(
    (target) => ({
      raw: target,
      path: fs.resolve(cwd, String(target), { expandTilde: true }),
    }),
  );
  const targetDirs = normalizeTargetDirs(config.target?.dir).map((item) => ({
    kind: item.kind,
    path: fs.resolve(cwd, String(item.path), { expandTilde: true }),
  }));

  if (targets.length === 0 && targetDirs.length === 0) {
    warn('warning: bundle:slug-tree:fs skipped (no target configured)');
    return;
  }

  const ignore = config.ignore ? [...config.ignore] : undefined;
  const docid = SlugBundle.Transform.TreeFs.resolveDocid(config.docid);
  const sourceReady = await checkSourceDir({
    fs,
    root,
    source: String(config.source ?? '.'),
    onWarning: warn,
  });
  if (!sourceReady) return;

  const treeDoc = await SlugTree.fromDir(
    { root },
    {
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
    const ok = await prepareTargetDir({ fs, targetDir: targetDir.path, onWarning: warn });
    if (!ok) continue;
    await clearTargetDir({ fs, targetDir: targetDir.path });

    if (targetDir.kind === 'source') {
      sourceFiles += await writeSlugTreeSourceDir({
        fs,
        root,
        targetDir: targetDir.path,
        ignore,
      });
      continue;
    }

    if (targetDir.kind === 'sha256') {
      fileContent = await writeSlugTreeSha256Dir({
        fs,
        root,
        targetDir: targetDir.path,
        ignore,
        includePath,
        docid,
        manifests: targets.map((t) => t.path),
      });
      sha256Files += fileContent.sha256.length;
      continue;
    }

    warn(`warning: bundle:slug-tree:fs skipped unsupported target.dir kind: ${targetDir.kind}`);
  }

  for (const target of targets) {
    const ext = Fs.extname(target.path).toLowerCase();
    const dir = fs.dirname(target.path);
    await fs.ensureDir(dir);

    if (ext === '.json') {
      await fs.write(target.path, Json.stringify(treeDoc));
      manifests += 1;
      const assetsPath = SlugBundle.Transform.TreeFs.deriveAssetsPath(target.path);
      if (assetsPath && fileContent && fileContent.entries.length > 0) {
        if (!fileContent.index) {
          warn(
            'warning: bundle:slug-tree:fs skipped assets index (docid unresolved for this bundle). Fix the `slug-tree:fs` config by adding `docid: <id>` at the bundle root (same level as `kind`, `source`, `target`), or rename the JSON manifest target to `slug-tree.<docid>.json`.',
          );
          continue;
        }
        await fs.ensureDir(fs.dirname(assetsPath));
        await fs.write(assetsPath, Json.stringify(fileContent.index));
        manifests += 1;
      }
      continue;
    }

    if (ext === '.yaml' || ext === '.yml') {
      await fs.write(target.path, SlugTree.toYaml(treeDoc));
      manifests += 1;
      continue;
    }

    warn(`warning: bundle:slug-tree:fs skipped unsupported target: ${target.raw}`);
  }

  const elapsed = Date.now() - startedAt;
  const files = sourceFiles > 0 ? sourceFiles : sha256Files;
  return { files, sourceFiles, sha256Files, manifests, elapsed };
}

/**
 * Helpers
 */
async function checkSourceDir(args: {
  fs: t.SlugTreeFsRuntime;
  root: t.StringDir;
  source: string;
  onWarning: (message: string) => void;
}): Promise<boolean> {
  const { fs, root, source, onWarning } = args;
  const exists = await fs.exists(root);
  if (!exists) {
    onWarning(
      `warning: bundle:slug-tree:fs skipped (source directory not found)\n- source:   ${source}\n- resolved: ${root}`,
    );
    return false;
  }

  const info = await fs.stat(root);
  if (!info || !info.isDirectory) {
    onWarning(
      `warning: bundle:slug-tree:fs skipped (source is not a directory)\n- source:   ${source}\n- resolved: ${root}`,
    );
    return false;
  }

  return true;
}

async function writeSlugTreeSha256Dir(args: {
  fs: t.SlugTreeFsRuntime;
  root: t.StringDir;
  targetDir: t.StringDir;
  ignore?: readonly string[];
  includePath?: boolean;
  docid?: t.StringId;
  manifests?: readonly t.StringPath[];
}): Promise<t.SlugBundleTransform.TreeFs.FileContentDerived> {
  const files = await readSlugTreeSourceFiles({
    fs: args.fs,
    root: args.root,
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
    const outPath = args.fs.join(args.targetDir, item.filename);
    await args.fs.write(outPath, Json.stringify(item.doc));
  }

  return derived.value;
}
