import { type t, Fs, Json, Path } from './common.ts';
import { refreshMountDist, refreshRootDist } from './u.dist.ts';
import { refreshMounts } from './u.mounts.ts';

export async function prepareTarget(target: string): Promise<void> {
  const exists = await Fs.exists(target);
  if (exists) await Fs.remove(target);
  await Fs.ensureDir(target);
}

export async function writeTreeMountOutputs(args: {
  target: t.StringPath;
  mount: t.StringId;
  treeJson: unknown;
  treeYaml: string;
}) {
  const manifestsDir = Fs.join(args.target, 'manifests');
  const contentDir = Fs.join(args.target, 'content');
  await Fs.ensureDir(manifestsDir);
  await Fs.ensureDir(contentDir);

  const manifestJson = Fs.join(manifestsDir, `slug-tree.${args.mount}.json`);
  const manifestYaml = Fs.join(manifestsDir, `slug-tree.${args.mount}.yaml`);
  const assetsJson = Fs.join(manifestsDir, `slug-tree.${args.mount}.assets.json`);

  await Fs.write(manifestJson, `${Json.stringify(args.treeJson, 2)}\n`);
  await Fs.write(manifestYaml, args.treeYaml);

  return {
    manifestsDir: manifestsDir as t.StringDir,
    contentDir: contentDir as t.StringDir,
    manifestJson: manifestJson as t.StringFile,
    manifestYaml: manifestYaml as t.StringFile,
    assetsJson: assetsJson as t.StringFile,
  };
}

export async function writeTreeFsDerivedOutputs(args: {
  contentDir: t.StringDir;
  assetsJson: t.StringFile;
  derived: t.SlugBundleTransform.TreeFs.FileContentDerived;
}) {
  for (const item of args.derived.sha256) {
    await Fs.write(Fs.join(args.contentDir, item.filename), `${Json.stringify(item.doc, 2)}\n`);
  }

  if (args.derived.index) {
    await Fs.write(args.assetsJson, `${Json.stringify(args.derived.index, 2)}\n`);
  }
}

export async function writeDerivedManifestOutputs(args: {
  manifestsDir: t.StringDir;
  derived: t.SlugBundleTransform.Derived;
}) {
  const outputs: Array<{ path: string; value: unknown }> = [];
  if (args.derived.manifests.assets) {
    outputs.push({ path: args.derived.files.assets.path, value: args.derived.manifests.assets });
  }
  if (args.derived.manifests.playback) {
    outputs.push({ path: args.derived.files.playback.path, value: args.derived.manifests.playback });
  }
  if (args.derived.manifests.tree) {
    outputs.push({ path: args.derived.files.tree.path, value: args.derived.manifests.tree });
  }

  for (const output of outputs) {
    const filename = Path.basename(output.path);
    await Fs.write(Fs.join(args.manifestsDir, filename), `${Json.stringify(output.value, 2)}\n`);
  }
}

export async function refreshStagedRoot(root: t.StringDir) {
  const mountsPath = await refreshMounts(root);
  const distPath = await refreshRootDist(root);
  return { mountsPath, distPath };
}

export async function refreshMount(target: t.StringDir) {
  return await refreshMountDist(target);
}
