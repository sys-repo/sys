import { type t, Fs, Ignore, Json, Path, SlugBundle, SlugTree, SlugTreeFs } from './common.ts';
import { refreshMounts } from './u.mounts.ts';

export const stageFolder: t.SlcDataPipeline.StageFolder.Run = async (args) => {
  const source = String(args.source).trim();
  const target = String(args.target).trim();
  const mount = String(args.mount ?? '').trim() || Path.basename(source);
  if (!source) throw new Error('stageFolder: source is required');
  if (!target) throw new Error('stageFolder: target is required');
  if (!mount) throw new Error('stageFolder: mount is required');

  const sourceInfo = await Fs.stat(source);
  if (!sourceInfo || !sourceInfo.isDirectory) {
    throw new Error(`stageFolder: source directory not found: ${source}`);
  }

  await prepareTarget(target);

  const mountId = mount as t.StringId;
  const manifestsDir = Fs.join(target, 'manifests');
  const contentDir = Fs.join(target, 'content');
  await Fs.ensureDir(manifestsDir);
  await Fs.ensureDir(contentDir);

  const manifestJson = Fs.join(manifestsDir, `slug-tree.${mountId}.json`);
  const manifestYaml = Fs.join(manifestsDir, `slug-tree.${mountId}.yaml`);
  const assetsJson = Fs.join(manifestsDir, `slug-tree.${mountId}.assets.json`);

  const treeDoc = await SlugTreeFs.fromDir({ root: source });
  await Fs.write(manifestJson, `${Json.stringify(treeDoc, 2)}\n`);
  await Fs.write(manifestYaml, SlugTree.toYaml(treeDoc));

  const files = await readSourceFiles(source);
  const derived = await SlugBundle.Transform.TreeFs.derive({
    files,
    includePath: true,
    docid: mountId,
    manifests: [manifestJson],
  });
  if (!derived.ok) throw derived.error;

  for (const item of derived.value.sha256) {
    await Fs.write(Fs.join(contentDir, item.filename), `${Json.stringify(item.doc, 2)}\n`);
  }

  if (derived.value.index) {
    await Fs.write(assetsJson, `${Json.stringify(derived.value.index, 2)}\n`);
  }

  await refreshMounts(Path.dirname(target) as t.StringDir);

  return {
    ok: true,
    kind: 'stage-folder',
    mount: mountId,
    source,
    target,
  };
};

const DEFAULT_IGNORE = Ignore.normalize(['node_modules', '.git', '.tmp', '.*', '.DS_Store']);

async function prepareTarget(target: string): Promise<void> {
  const exists = await Fs.exists(target);
  if (exists) await Fs.remove(target);
  await Fs.ensureDir(target);
}

async function readSourceFiles(root: string): Promise<readonly { path: t.StringPath; source: string; name: string }[]> {
  const ignore = Ignore.create(DEFAULT_IGNORE);
  const files: { path: t.StringPath; source: string; name: string }[] = [];

  for await (const entry of Fs.walk(root, {
    includeDirs: false,
    includeFiles: true,
    includeSymlinks: false,
    followSymlinks: false,
  })) {
    const rel = Path.relative(root, entry.path).replaceAll('\\', '/');
    if (!rel || ignore.isIgnored(rel as t.StringPath)) continue;
    if (Path.extname(entry.name).toLowerCase() !== '.md') continue;
    const source = String((await Fs.readText(entry.path)).data ?? '');
    files.push({ path: rel as t.StringPath, source, name: entry.name });
  }

  return files;
}
