import { type t, Ffmpeg, Fs, Hash, Is, Json, Obj, Slug, SlugBundle } from './common.ts';

type BundleSeqOpts = {
  facets?: t.BundleSequenceFacet[];
  outDir?: string;
  baseHref?: string;
  target?: t.SlugBundleMediaSeq['target'];
  requirePlayback?: boolean;
};

/**
 * Candidate integration seam for routing the compiler media-seq bundler through Bundle.Transform.
 * This is the NEW transform-backed path kept separate from the legacy implementation during parity-gated migration.
 */
export async function bundleSequenceFilepathsViaTransform(
  dag: t.BundleSequenceDag,
  yamlPath: t.ObjectPath,
  docid: t.Crdt.Id,
  opts: BundleSeqOpts = {},
): Promise<t.BundleSequenceResult> {
  const runtime = resolveRuntimeTargetDefaults(opts);
  const dir: t.BundleSequenceResult['dir'] = {
    base: runtime.manifestsBase,
    manifests: runtime.manifestsDir,
    video: runtime.videoDir,
    image: runtime.imageDir,
  };

  const resolvedSources = new Map<string, string>();
  const Parse = Slug.parser(yamlPath);
  const PathCtx = Parse.path(dag, docid);

  const assetResolver: t.SlugBundleTransform.AssetResolver = async (args) => {
    try {
      if (!PathCtx.ok) return { ok: true, value: undefined };
      const expanded = PathCtx.resolve(args.logicalPath);
      const resolvedPath = Fs.Tilde.expand(expanded?.value ?? '');
      if (!resolvedPath) return { ok: true, value: undefined };
      const exists = await Fs.exists(resolvedPath);
      if (!exists) return { ok: true, value: undefined };

      const bytes = (await Fs.read(resolvedPath)).data;
      const hash = Hash.sha256(bytes);
      const stat = await Fs.stat(resolvedPath);
      const stats = Is.number(stat?.size) ? { bytes: stat.size } : undefined;
      resolvedSources.set(sourceKey(args.kind, args.logicalPath), resolvedPath);
      return {
        ok: true,
        value: {
          kind: args.kind,
          logicalPath: args.logicalPath,
          hash,
          bytes,
          stats,
          source: { resolvedPath },
        },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      return { ok: false, error: err };
    }
  };

  const durationProbe: t.SlugBundleTransform.DurationProbe = async (args) => {
    if (args.asset.kind !== 'video') return undefined;
    const resolvedPath = resolveSourcePathFromProbe(args.asset);
    if (!resolvedPath) return undefined;
    const result = await Ffmpeg.duration(resolvedPath);
    return result.ok ? result.msecs : undefined;
  };

  const derive = await SlugBundle.Transform.derive({
    dag,
    yamlPath,
    docid,
    target: runtime.target,
    requirePlayback: opts.requirePlayback,
    facets: opts.facets,
    assetResolver,
    durationProbe,
  });

  if (!derive.ok) throw derive.error;
  const value = derive.value;

  await materializeTransformAssets({
    manifests: value.manifests.assets,
    dir: value.dir,
    sources: resolvedSources,
    imageBase: runtime.imageBase,
    videoBase: runtime.videoBase,
  });

  await writeTransformManifests({
    files: value.files,
    manifests: value.manifests,
  });

  const issues = value.issues.map((issue) => toLintIssue(issue));
  return Obj.asGetter({ dir, issues }, ['issues']);
}

function resolveShardTemplate(
  value: string,
  shard?: { readonly index: number; readonly total: number },
): string {
  if (!value.includes('<shard>') && !value.includes('<shards>')) return value;
  if (!shard) return value;
  return value
    .replaceAll('<shard>', String(shard.index))
    .replaceAll('<shards>', String(shard.total));
}

function resolvePath(baseDir: string, subPath: string, filename?: string): string {
  if (filename && Fs.Path.Is.absolute(filename)) return filename;
  if (Fs.Path.Is.absolute(subPath)) {
    return filename ? Fs.join(subPath, filename) : subPath;
  }
  return filename ? Fs.join(baseDir, subPath, filename) : Fs.join(baseDir, subPath);
}

function resolveRuntimeTargetDefaults(opts: BundleSeqOpts) {
  const manifestsBase =
    opts.target?.manifests?.base ?? opts.outDir ?? Fs.join(Fs.cwd('terminal'), 'publish.assets');
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

async function materializeTransformAssets(args: {
  manifests?: t.SlugAssetsManifest;
  dir: { readonly video: string; readonly image: string };
  sources: Map<string, string>;
  imageBase: string;
  videoBase: string;
}) {
  const assets = args.manifests?.assets ?? [];
  for (const asset of assets) {
    const source = args.sources.get(sourceKey(asset.kind, String(asset.logicalPath)));
    if (!source) continue;
    const kindDir = asset.kind === 'image' ? args.dir.image : args.dir.video;
    const kindDirResolved = resolveShardTemplate(kindDir, asset.shard);
    const destBase = asset.kind === 'image' ? args.imageBase : args.videoBase;
    const destDir = resolvePath(destBase, kindDirResolved);
    const destPath = Fs.join(destDir, asset.filename);
    await Fs.ensureDir(destDir);
    if (!(await Fs.exists(destPath))) await Fs.copy(source, destPath);
  }
}

async function writeTransformManifests(args: {
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
    await Fs.ensureDir(Fs.dirname(args.files.assets.path));
    await Fs.write(args.files.assets.path, Json.stringify(args.manifests.assets));
  }
  if (args.manifests.playback) {
    await Fs.ensureDir(Fs.dirname(args.files.playback.path));
    await Fs.write(args.files.playback.path, Json.stringify(args.manifests.playback));
  }
  if (args.manifests.tree) {
    await Fs.ensureDir(Fs.dirname(args.files.tree.path));
    await Fs.write(args.files.tree.path, Json.stringify(args.manifests.tree));
  }
}

function toLintIssue(issue: {
  kind: string;
  severity: 'error' | 'warning';
  message: string;
  path?: string;
  raw?: string;
  resolvedPath?: string;
  doc?: { id?: string };
}): t.LintSequenceFilepath {
  return {
    kind: issue.kind as t.LintSequenceFilepathKind,
    severity: issue.severity,
    message: issue.message,
    path: issue.path ?? '',
    raw: issue.raw ?? '',
    resolvedPath: issue.resolvedPath ?? '',
    ...(issue.doc?.id ? { doc: { id: issue.doc.id as t.Crdt.Id } } : {}),
  } as t.LintSequenceFilepath;
}

function sourceKey(kind: string, logicalPath: string): string {
  return `${kind}|${logicalPath}`;
}

function resolveSourcePathFromProbe(asset: { source?: unknown }): string | undefined {
  if (!asset.source || typeof asset.source !== 'object') return undefined;
  const value = (asset.source as Record<string, unknown>)['resolvedPath'];
  return typeof value === 'string' ? value : undefined;
}
