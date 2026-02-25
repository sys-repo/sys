import { type t, Is, Path, Shard, SlugSchema, Str } from './common.ts';
import { isDagLike } from './u.dag.ts';
import { sequenceFromDag } from './u.policy.sequence.ts';

type AssetIssue = t.SlugBundleTransform.Issue;
type AssetResult = {
  readonly issues: readonly AssetIssue[];
  readonly manifest?: t.SlugAssetsManifest;
};

export async function deriveAssets(args: {
  readonly derive: t.SlugBundleTransform.DeriveArgs;
  readonly base: t.SlugBundleTransform.Derived;
}): Promise<AssetResult> {
  const { derive, base } = args;
  if (!derive.assetResolver) return { issues: [] };
  if (!isDagLike(derive.dag)) return { issues: [] };

  const facets = resolveFacets(derive.target, derive.facets);
  if (facets.length === 0) return { issues: [] };

  const yamlPathStr = Is.array(derive.yamlPath) && derive.yamlPath.length > 0 ? derive.yamlPath.join('/') : '';
  const docid = String(derive.docid) as t.StringId;
  const issues: AssetIssue[] = [];
  const assets: t.SlugAsset[] = [];

  const seqResult = await sequenceFromDag(derive.dag as t.SlugBundleTransform.Dag.Shape, derive.yamlPath, docid, {
    validate: false,
    trait: { of: 'media-composition' },
  });
  if (!seqResult.ok) return { issues };

  const hrefBaseVideo = resolveHrefBase(derive.target?.media?.video?.hrefBase, derive.target?.manifests?.hrefBase);
  const hrefBaseImage = resolveHrefBase(derive.target?.media?.image?.hrefBase, derive.target?.manifests?.hrefBase);

  for (const media of walkSequenceMediaRefs(seqResult.sequence, facets)) {
    const resolved = await derive.assetResolver({
      docid,
      kind: media.kind,
      logicalPath: media.logicalPath,
    });

    if (!resolved.ok) {
      issues.push(toResolverIssue({
        kind: media.kind,
        docid,
        logicalPath: media.logicalPath,
        message: `Error resolving ${media.kind} path "${media.logicalPath}": ${resolved.error.message}`,
      }));
      continue;
    }

    if (!resolved.value) {
      issues.push(toResolverIssue({
        kind: media.kind,
        docid,
        logicalPath: media.logicalPath,
        message: `File does not exist at resolved path "${media.logicalPath}".`,
      }));
      continue;
    }

    const asset = await toAssetManifestEntry({
      item: resolved.value,
      logicalPath: media.logicalPath,
      target: derive.target,
      dir: base.dir,
      hrefBase: media.kind === 'image' ? hrefBaseImage : hrefBaseVideo,
      durationProbe: derive.durationProbe,
      docid,
    });

    if (!asset.ok) {
      issues.push(toResolverIssue({
        kind: media.kind,
        docid,
        logicalPath: media.logicalPath,
        message: asset.error.message,
      }));
      continue;
    }

    assets.push(asset.value);
  }

  if (assets.length === 0) return { issues };

  const manifest: t.SlugAssetsManifest = { docid, assets };
  const res = SlugSchema.Manifest.Validate.assets(manifest);
  if (!res.ok) {
    issues.push({
      kind: 'sequence:assets:not-exported',
      severity: 'error',
      path: yamlPathStr,
      raw: base.files.assets.raw,
      resolvedPath: '',
      doc: { id: docid },
      message: `Assets manifest failed @sys/schema validation. Reason: ${res.error.message}`,
    });
    return { issues };
  }

  return { issues, manifest: res.sequence };
}

type MediaRef = { kind: t.SlugBundleTransform.MediaKind; logicalPath: string };

function resolveFacets(
  target?: t.SlugBundleTransform.Target,
  facets?: readonly t.SlugBundleTransform.Facet[],
): t.SlugBundleTransform.Facet[] {
  if (facets !== undefined) {
    return facets.filter((v) => String(v).startsWith('media:seq:file:'));
  }
  if (!target?.media) return ['media:seq:file:video', 'media:seq:file:image'];
  const next: t.SlugBundleTransform.Facet[] = [];
  if (target.media.video) next.push('media:seq:file:video');
  if (target.media.image) next.push('media:seq:file:image');
  return next;
}

function* walkSequenceMediaRefs(
  sequence: readonly t.SequenceItem[],
  facets: readonly t.SlugBundleTransform.Facet[],
): Generator<MediaRef> {
  const hasVideo = facets.includes('media:seq:file:video');
  const hasImage = facets.includes('media:seq:file:image');

  for (const item of sequence) {
    if (!Is.record(item)) continue;
    if (hasVideo && Is.str((item as Record<string, unknown>)['video'])) {
      yield { kind: 'video', logicalPath: String((item as Record<string, unknown>)['video']) };
    }
    if (hasImage && Is.str((item as Record<string, unknown>)['image'])) {
      yield { kind: 'image', logicalPath: String((item as Record<string, unknown>)['image']) };
    }

    const timestamps = (item as Record<string, unknown>)['timestamps'];
    if (!Is.record(timestamps)) continue;
    for (const value of Object.values(timestamps)) {
      if (!Is.record(value)) continue;
      if (hasImage && Is.str(value['image'])) {
        yield { kind: 'image', logicalPath: String(value['image']) };
      }
    }
  }
}

async function toAssetManifestEntry(args: {
  readonly item: t.SlugBundleTransform.ResolvedAsset;
  readonly logicalPath: string;
  readonly target?: t.SlugBundleTransform.Target;
  readonly dir: t.SlugBundleTransform.DirLayout;
  readonly hrefBase: string;
  readonly durationProbe?: t.SlugBundleTransform.DurationProbe;
  readonly docid: t.StringId;
}): Promise<{ ok: true; value: t.SlugAsset } | { ok: false; error: Error }> {
  const { item, logicalPath, target, dir, hrefBase, durationProbe, docid } = args;
  const hash = item.hash;
  if (!hash) return { ok: false, error: new Error(`Resolved ${item.kind} path "${logicalPath}" is missing "hash".`) };

  const ext = resolveExt(item, logicalPath);
  const filename = item.filename ?? `${hash}${ext}`;

  const shardConfig = item.kind === 'image' ? target?.media?.image?.shard : target?.media?.video?.shard;
  const shard =
    item.shard ??
    (shardConfig && Is.number(shardConfig.total)
      ? (Shard.meta(Shard.policy(shardConfig.total, shardConfig.strategy), hash) as t.SlugBundleTransform.ShardMeta)
      : undefined);

  const kindDir = item.kind === 'image' ? dir.image : dir.video;
  const kindDirResolved = resolveShardTemplate(String(kindDir), shard);
  const href = item.href ?? `${hrefBase}/${kindDirResolved}/${filename}`;

  let duration = (item.stats as { duration?: t.Msecs } | undefined)?.duration;
  if (item.kind === 'video' && duration === undefined && durationProbe) {
    duration = await durationProbe({ docid, asset: item });
  }

  const bytes = item.stats?.bytes ?? (item.bytes ? item.bytes.byteLength : undefined);

  const value: t.SlugAsset = {
    kind: item.kind,
    logicalPath: logicalPath as t.StringPath,
    hash,
    filename,
    href,
    ...(shard ? { shard } : {}),
    stats: { bytes, duration },
  };
  return { ok: true, value };
}

function resolveExt(item: t.SlugBundleTransform.ResolvedAsset, logicalPath: string): string {
  if (item.filename) {
    const ext = Path.extname(item.filename);
    if (ext) return ext;
  }
  const fromLogical = Path.extname(logicalPath);
  return fromLogical || '';
}

function resolveShardTemplate(
  value: string,
  shard?: { readonly index: number; readonly total: number },
): string {
  if (!value.includes('<shard>') && !value.includes('<shards>')) return value;
  if (!shard) return value;
  return value.replaceAll('<shard>', String(shard.index)).replaceAll('<shards>', String(shard.total));
}

function resolveHrefBase(kindHrefBase?: string, manifestsHrefBase?: string): string {
  return Str.trimTrailingSlashes(kindHrefBase ?? manifestsHrefBase ?? '/');
}

function toResolverIssue(args: {
  readonly kind: t.SlugBundleTransform.MediaKind;
  readonly docid: t.StringId;
  readonly logicalPath: string;
  readonly message: string;
}): AssetIssue {
  return {
    kind: args.kind === 'image' ? 'image-path:not-found' : 'video-path:not-found',
    severity: 'error',
    path: args.logicalPath,
    raw: args.logicalPath,
    resolvedPath: '',
    doc: { id: args.docid },
    message: args.message,
  };
}
