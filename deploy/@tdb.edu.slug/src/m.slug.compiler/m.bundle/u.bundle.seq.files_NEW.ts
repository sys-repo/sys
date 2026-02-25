import { type t, Crdt, Ffmpeg, Fs, Hash, Is, Json, Obj, Slug, SlugBundle } from './common.ts';

type BundleSeqOpts = {
  facets?: t.BundleSequenceFacet[];
  outDir?: string;
  baseHref?: string;
  target?: t.SlugBundleMediaSeq['target'];
  requirePlayback?: boolean;
};

type RuntimeTargetLayout = ReturnType<typeof resolveRuntimeTargetDefaults>;
type SourceMap = Map<string, string>;

/**
 * NEW transform-backed compiler media-seq bundler path (runtime adapter/materializer).
 * Kept separate from the legacy implementation during parity-gated migration.
 */
export async function bundleSequenceFilepaths_NEW(
  dag: t.BundleSequenceDag,
  yamlPath: t.ObjectPath,
  docid: t.Crdt.Id,
  opts: BundleSeqOpts = {},
): Promise<t.BundleSequenceResult> {
  const targetRuntime = resolveRuntimeTargetDefaults(opts);
  const resolvedSources = new Map<string, string>();
  const parse = Slug.parser(yamlPath);
  const pathCtx = parse.path(dag, docid);

  const assetResolver = makeAssetResolver({ pathCtx, resolvedSources });
  const durationProbe = makeDurationProbe();

  const derive = await SlugBundle.Transform.derive({
    dag,
    yamlPath,
    docid,
    target: targetRuntime.target,
    requirePlayback: opts.requirePlayback,
    facets: opts.facets,
    assetResolver,
    durationProbe,
  });
  if (!derive.ok) throw derive.error;

  const derived = derive.value;

  await materializeTransformAssets({
    manifests: derived.manifests.assets,
    dir: derived.dir,
    sources: resolvedSources,
    imageBase: targetRuntime.imageBase,
    videoBase: targetRuntime.videoBase,
  });

  await writeTransformManifests({
    files: derived.files,
    manifests: derived.manifests,
  });

  return toBundleSequenceResult({
    dir: {
      base: targetRuntime.manifestsBase,
      manifests: targetRuntime.manifestsDir,
      video: targetRuntime.videoDir,
      image: targetRuntime.imageDir,
    },
    issues: derived.issues,
  });
}

/**
 * Compiler runtime adapters → Bundle.Transform.
 */
function makeAssetResolver(args: {
  pathCtx: ReturnType<ReturnType<typeof Slug.parser>['path']>;
  resolvedSources: SourceMap;
}): t.SlugBundleTransform.AssetResolver {
  return async (asset) => {
    try {
      if (!args.pathCtx.ok) return { ok: true, value: undefined };
      const expanded = args.pathCtx.resolve(asset.logicalPath);
      const resolvedPath = Fs.Tilde.expand(expanded?.value ?? '');
      if (!resolvedPath) return { ok: true, value: undefined };
      const exists = await Fs.exists(resolvedPath);
      if (!exists) return { ok: true, value: undefined };

      const bytes = (await Fs.read(resolvedPath)).data;
      const hash = Hash.sha256(bytes);
      const stat = await Fs.stat(resolvedPath);
      const stats = Is.number(stat?.size) ? { bytes: stat.size } : undefined;
      args.resolvedSources.set(sourceKey(asset.kind, asset.logicalPath), resolvedPath);

      return {
        ok: true,
        value: {
          kind: asset.kind,
          logicalPath: asset.logicalPath,
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
}

function makeDurationProbe(): t.SlugBundleTransform.DurationProbe {
  return async (args) => {
    if (args.asset.kind !== 'video') return undefined;
    const resolvedPath = resolveSourcePathFromProbe(args.asset);
    if (!resolvedPath) return undefined;
    const result = await Ffmpeg.duration(resolvedPath);
    return result.ok ? result.msecs : undefined;
  };
}

/**
 * Runtime materialization.
 */
async function materializeTransformAssets(args: {
  manifests?: t.SlugAssetsManifest;
  dir: { readonly video: string; readonly image: string };
  sources: SourceMap;
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

/**
 * Compiler compatibility mapping.
 */
function toBundleSequenceResult(args: {
  dir: t.BundleSequenceResult['dir'];
  issues: readonly t.SlugBundleTransform.Issue[];
}): t.BundleSequenceResult {
  const issues = args.issues.map((issue) => toLintIssue(issue));
  return Obj.asGetter({ dir: args.dir, issues }, ['issues']);
}

function toLintIssue(issue: t.SlugBundleTransform.Issue): t.LintSequenceFilepath {
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

/**
 * Runtime target normalization.
 */
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

/**
 * Small local utilities.
 */
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

function sourceKey(kind: string, logicalPath: string): string {
  return `${kind}|${logicalPath}`;
}

function resolveSourcePathFromProbe(asset: { source?: unknown }): string | undefined {
  if (!asset.source || typeof asset.source !== 'object') return undefined;
  const value = (asset.source as Record<string, unknown>)['resolvedPath'];
  return typeof value === 'string' ? value : undefined;
}
