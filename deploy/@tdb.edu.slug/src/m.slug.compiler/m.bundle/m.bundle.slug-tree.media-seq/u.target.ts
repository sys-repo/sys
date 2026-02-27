import { type t, Fs, FsCapability } from './common.ts';

export type BundleSeqOpts = {
  facets?: t.BundleSequenceFacet[];
  outDir?: string;
  baseHref?: string;
  target?: t.SlugBundleMediaSeq['target'];
  requirePlayback?: boolean;
};

export function resolveRuntimeTargetDefaults(opts: BundleSeqOpts, fsCap?: t.FsCapability.Instance) {
  const fs = fsCap ?? FsCapability.fromFs(Fs);
  const manifestsBase =
    opts.target?.manifests?.base ?? opts.outDir ?? fs.join(fs.cwd('terminal'), 'publish.assets');
  const manifestsDir = opts.target?.manifests?.dir ?? 'manifests';
  const videoBase = opts.target?.media?.video?.base ?? manifestsBase;
  const imageBase = opts.target?.media?.image?.base ?? manifestsBase;
  const videoDir = opts.target?.media?.video?.dir ?? 'video';
  const imageDir = opts.target?.media?.image?.dir ?? 'image';
  const target: t.SlugBundleMediaSeq['target'] = {
    manifests: {
      base: manifestsBase,
      hrefBase: opts.target?.manifests?.hrefBase ?? opts.baseHref,
      dir: manifestsDir,
      assets: opts.target?.manifests?.assets,
      playback: opts.target?.manifests?.playback,
      tree: opts.target?.manifests?.tree,
    },
    media: {
      ...(opts.target?.media?.video !== undefined || opts.target?.media === undefined
        ? {
            video: {
              ...(opts.target?.media?.video ?? {}),
              base: videoBase,
              dir: videoDir,
              hrefBase:
                opts.target?.media?.video?.hrefBase ??
                opts.target?.manifests?.hrefBase ??
                opts.baseHref,
            },
          }
        : {}),
      ...(opts.target?.media?.image !== undefined || opts.target?.media === undefined
        ? {
            image: {
              ...(opts.target?.media?.image ?? {}),
              base: imageBase,
              dir: imageDir,
              hrefBase:
                opts.target?.media?.image?.hrefBase ??
                opts.target?.manifests?.hrefBase ??
                opts.baseHref,
            },
          }
        : {}),
    },
  };
  return { manifestsBase, manifestsDir, videoBase, imageBase, videoDir, imageDir, target };
}
