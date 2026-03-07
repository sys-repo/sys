import { type t, Json } from './common.ts';
import { sourceKey } from './u.adapter.ts';

type SourceMap = Map<string, string>;

export async function materializeTransformAssets(args: {
  fs: t.FsCapability.Instance;
  hints?: readonly t.SlugBundleTransform.AssetMaterializeHint[];
  sources: SourceMap;
}) {
  const hints = args.hints ?? [];
  for (const hint of hints) {
    const source = args.sources.get(sourceKey(hint.kind, String(hint.logicalPath)));
    if (!source) continue;
    const destPath = String(hint.destPath);
    const destDir = args.fs.dirname(destPath);
    await args.fs.ensureDir(destDir);
    if (!(await args.fs.exists(destPath))) await args.fs.copy(source, destPath);
  }
}

export async function writeTransformManifests(args: {
  fs: t.FsCapability.Instance;
  files: {
    assets: { path: string };
    playback: { path: string };
    tree: { path: string };
  };
  manifests: {
    assets?: t.SlugAssetsManifest;
    playback?: t.SpecTimelineManifest;
    tree?: t.SlugTreeDoc;
  };
}) {
  if (args.manifests.assets) {
    await args.fs.ensureDir(args.fs.dirname(args.files.assets.path));
    await args.fs.write(args.files.assets.path, Json.stringify(args.manifests.assets));
  }
  if (args.manifests.playback) {
    await args.fs.ensureDir(args.fs.dirname(args.files.playback.path));
    await args.fs.write(args.files.playback.path, Json.stringify(args.manifests.playback));
  }
  if (args.manifests.tree) {
    await args.fs.ensureDir(args.fs.dirname(args.files.tree.path));
    await args.fs.write(args.files.tree.path, Json.stringify(args.manifests.tree));
  }
}
