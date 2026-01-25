import { type t } from './common.ts';
import { Assets } from './m.io.Assets.ts';
import { Playback } from './m.io.Playback.ts';
import { SlugUrl } from './m.Url.ts';
import { Dist } from './u.io.Dist.ts';

export const Bundle: t.SlugClientBundleLib = {
  load,
};

async function load<P = unknown>(
  baseUrl: t.StringUrl,
  docid: t.StringId,
  opts?: t.SlugLoadOptions,
): Promise<t.SlugClientResult<t.SpecTimelineBundle<P>>> {
  const distResult = await Dist.load(baseUrl, opts);
  if (!distResult.ok) return { ok: false, error: distResult.error };
  const dist = distResult.value;

  const cleanedDocid = SlugUrl.clean(docid);
  const playbackKey = SlugUrl.playbackFilename(cleanedDocid);
  const assetsKey = SlugUrl.assetsFilename(cleanedDocid);

  if (!Dist.hasPart(dist, playbackKey)) {
    return {
      ok: false,
      error: {
        kind: 'schema',
        message: `Playback manifest not present in dist.json: ${playbackKey}`,
      },
    };
  }

  let assetsManifest: t.SpecTimelineAssetsManifest;
  if (Dist.hasPart(dist, assetsKey)) {
    const assetsResult = await Assets.load(baseUrl, docid, opts);
    if (!assetsResult.ok) return { ok: false, error: assetsResult.error };
    assetsManifest = assetsResult.value;
  } else {
    assetsManifest = { docid: cleanedDocid, assets: [] };
  }

  const playbackResult = await Playback.load<P>(baseUrl, docid, opts);
  if (!playbackResult.ok) return { ok: false, error: playbackResult.error };

  const hrefBase = new URL(opts?.baseHref ?? baseUrl);
  const baseOrigin = hrefBase.origin;
  const basePath = hrefBase.pathname.replace(/\/$/, '');
  const normalizeHref = (href: string) => {
    if (SlugUrl.isAbsoluteHref(href)) return href;
    if (href.startsWith('/')) {
      return new URL(`${basePath}${href}`, baseOrigin).toString();
    }
    return new URL(href, hrefBase.href).toString();
  };

  const assetMap = new Map<string, t.SpecTimelineAsset>();
  for (const asset of assetsManifest.assets) {
    const normalized: t.SpecTimelineAsset = {
      ...asset,
      href: normalizeHref(asset.href),
    };
    assetMap.set(`${asset.kind}:${asset.logicalPath}`, normalized);
  }

  const resolveAsset = (opts: t.Timecode.Playback.ResolverArgs) => {
    return assetMap.get(`${opts.kind}:${opts.logicalPath}`);
  };

  const bundle: t.SpecTimelineBundle<P> = {
    docid: cleanedDocid,
    spec: {
      composition: playbackResult.value.composition,
      beats: playbackResult.value.beats,
    },
    resolveAsset,
  };

  return { ok: true, value: bundle };
}
