import { type t, D, Shard } from './common.ts';
import { resolvePath, toOutputFile, toRelativeDir } from './u.path.ts';
import { cleanDocid } from './u.docid.ts';
import { resolveTemplate } from './u.template.ts';

export function deriveMeta(args: t.SlugBundleTransform.DeriveArgs): t.SlugBundleTransform.Derived {
  const docid = cleanDocid(args.docid);
  const target = args.target;

  const manifestsBase = target?.manifests?.base ?? D.manifestsBase;
  const manifestsDir = target?.manifests?.dir ?? D.manifestsDir;
  const videoDir = target?.media?.video?.dir ?? D.mediaDirVideo;
  const imageDir = target?.media?.image?.dir ?? D.mediaDirImage;

  const assetsTemplate = target?.manifests?.assets ?? D.assetsTemplate;
  const playbackTemplate = target?.manifests?.playback ?? D.playbackTemplate;
  const treeTemplate = target?.manifests?.tree ?? D.treeTemplate;

  const assetsFilename = resolveTemplate(assetsTemplate, docid);
  const playbackFilename = resolveTemplate(playbackTemplate, docid);
  const treeFilename = resolveTemplate(treeTemplate, docid);

  const assetsPath = resolvePath(manifestsBase, manifestsDir, assetsFilename);
  const playbackPath = resolvePath(manifestsBase, manifestsDir, playbackFilename);
  const treePath = resolvePath(manifestsBase, manifestsDir, treeFilename);

  const files: t.SlugBundleTransform.OutputFiles = {
    assets: toOutputFile({ baseDir: manifestsBase, path: assetsPath, filename: assetsFilename }),
    playback: toOutputFile({ baseDir: manifestsBase, path: playbackPath, filename: playbackFilename }),
    tree: toOutputFile({ baseDir: manifestsBase, path: treePath, filename: treeFilename }),
  };

  const dir: t.SlugBundleTransform.DirLayout = {
    base: manifestsBase as t.StringDir,
    manifests: manifestsDir as t.StringDir,
    video: videoDir as t.StringDir,
    image: imageDir as t.StringDir,
  };

  const includeVideo = target?.media ? target.media.video !== undefined : true;
  const includeImage = target?.media ? target.media.image !== undefined : true;
  const videoBase = target?.media?.video?.base ?? manifestsBase;
  const imageBase = target?.media?.image?.base ?? manifestsBase;
  const shareVideoBase = videoBase === manifestsBase;
  const shareImageBase = imageBase === manifestsBase;

  const mediaDirs =
    (includeVideo && shareVideoBase) || (includeImage && shareImageBase)
      ? {
          ...(includeVideo && shareVideoBase
            ? { video: toRelativeDir(manifestsBase, videoDir) as t.StringDir }
            : {}),
          ...(includeImage && shareImageBase
            ? { image: toRelativeDir(manifestsBase, imageDir) as t.StringDir }
            : {}),
        }
      : undefined;

  const shardVideo = toDescriptorShardPolicy(target?.media?.video?.shard);
  const shardImage = toDescriptorShardPolicy(target?.media?.image?.shard);
  const shard =
    shardVideo || shardImage
      ? {
          ...(shardVideo ? { video: shardVideo } : {}),
          ...(shardImage ? { image: shardImage } : {}),
        }
      : undefined;

  const layout: t.SlugBundleTransform.DescriptorLayout = {
    manifestsDir: toRelativeDir(manifestsBase, manifestsDir) as t.StringDir,
    ...(mediaDirs ? { mediaDirs } : {}),
    ...(shard ? { shard } : {}),
  };

  return {
    docid: docid as t.StringId,
    issues: [],
    dir,
    layout,
    files,
    manifests: {},
  };
}
function toDescriptorShardPolicy(
  input?: t.SlugBundleTransform.ShardPolicyInput,
): t.SlugBundleTransform.ShardPolicy | undefined {
  if (!input) return;
  const policy = Shard.policy(input.total, input.strategy);
  return {
    strategy: policy.strategy as t.SlugBundleTransform.ShardStrategy,
    total: policy.shards,
    ...(input.host ? { host: input.host } : {}),
    ...(input.path ? { path: input.path } : {}),
  };
}
