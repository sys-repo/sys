import {
  type t,
  Ffmpeg,
  Fs,
  FsCapability,
  Hash,
  Is,
  Json,
  Obj,
  Slug,
  SlugBundle,
} from '../common.ts';

type SourceMap = Map<string, string>;
type SlugPathCtx = ReturnType<t.Parser['path']>;
type MediaDurationProbe = (path: string) => Promise<t.Msecs | undefined>;
type BundleSeqOpts = {
  facets?: t.BundleSequenceFacet[];
  outDir?: string;
  baseHref?: string;
  target?: t.SlugBundleMediaSeq['target'];
  requirePlayback?: boolean;
};

/**
 * Compiler media-seq bundler path (runtime adapter/materializer).
 * Uses `SlugBundle.Transform` for pure derivation and performs runtime materialization here.
 */
export async function bundleSequenceFilepaths(
  dag: t.BundleSequenceDag,
  yamlPath: t.ObjectPath,
  docid: t.Crdt.Id,
  opts: BundleSeqOpts = {},
): Promise<t.BundleSequenceResult> {
  const fs = FsCapability.fromFs(Fs);
  const targetRuntime = resolveRuntimeTargetDefaults(opts, fs);
  const resolvedSources = new Map<string, string>();
  const parse = Slug.parser(yamlPath);
  const pathCtx = parse.path(dag, docid);

  const assetResolver = makeAssetResolver({ fs, pathCtx, resolvedSources });
  const probeMediaDuration = makeMediaDurationProbe();
  const durationProbe = makeDurationProbe(probeMediaDuration);

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
    fs,
    hints: derived.materialize?.assets,
    sources: resolvedSources,
  });

  await writeTransformManifests({
    fs,
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
  fs: t.FsCapability.Instance;
  pathCtx: SlugPathCtx;
  resolvedSources: SourceMap;
}): t.SlugBundleTransform.AssetResolver {
  return async (asset) => {
    try {
      if (!args.pathCtx.ok) return { ok: true, value: undefined };
      const expanded = args.pathCtx.resolve(asset.logicalPath);
      const resolvedPath = args.fs.tildeExpand(expanded?.value ?? '');
      if (!resolvedPath) return { ok: true, value: undefined };
      const exists = await args.fs.exists(resolvedPath);
      if (!exists) return { ok: true, value: undefined };

      const bytes = (await args.fs.read(resolvedPath)).data;
      const hash = Hash.sha256(bytes);
      const stat = await args.fs.stat(resolvedPath);
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

function makeMediaDurationProbe(): MediaDurationProbe {
  return async (path) => {
    const result = await Ffmpeg.duration(path);
    return result.ok ? result.msecs : undefined;
  };
}

function makeDurationProbe(
  probeMediaDuration: MediaDurationProbe,
): t.SlugBundleTransform.DurationProbe {
  return async (args) => {
    if (args.asset.kind !== 'video') return undefined;
    const resolvedPath = resolveSourcePathFromProbe(args.asset);
    if (!resolvedPath) return undefined;
    return await probeMediaDuration(resolvedPath);
  };
}

/**
 * Runtime materialization.
 */
async function materializeTransformAssets(args: {
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

async function writeTransformManifests(args: {
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
function resolveRuntimeTargetDefaults(opts: BundleSeqOpts, fsCap?: t.FsCapability.Instance) {
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

function sourceKey(kind: string, logicalPath: string): string {
  return `${kind}|${logicalPath}`;
}

function resolveSourcePathFromProbe(asset: { source?: unknown }): string | undefined {
  if (!Is.record(asset.source)) return undefined;
  const value = (asset.source as Record<string, unknown>)['resolvedPath'];
  return Is.string(value) ? value : undefined;
}
