import { type t, Fs, Ignore, Json, Path, SlugBundle, SlugTree, SlugTreeFs } from './common.ts';
import { refreshMount } from './u.stage.shared.ts';
import { prepareTarget, refreshStagedRoot, writeTreeFsDerivedOutputs, writeTreeMountOutputs } from './u.stage.shared.ts';

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
  const treeDoc = await SlugTreeFs.fromDir({ root: source });
  const treeFiles = await writeTreeMountOutputs({
    target: target as t.StringPath,
    mount: mountId,
    treeJson: treeDoc,
    treeYaml: SlugTree.toYaml(treeDoc),
  });

  const files = await readSourceFiles(source);
  const derived = await SlugBundle.Transform.TreeFs.derive({
    files,
    includePath: true,
    docid: mountId,
    manifests: [treeFiles.manifestJson],
  });
  if (!derived.ok) throw derived.error;

  await writeTreeFsDerivedOutputs({
    contentDir: treeFiles.contentDir,
    assetsJson: treeFiles.assetsJson,
    derived: derived.value,
  });

  const root = Path.dirname(target) as t.StringDir;
  await refreshMount(target as t.StringDir);
  await refreshStagedRoot(root);

  return {
    ok: true,
    kind: 'stage-folder',
    mount: mountId,
    source,
    target,
  };
};

const DEFAULT_IGNORE = Ignore.normalize(['node_modules', '.git', '.tmp', '.*', '.DS_Store']);

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
