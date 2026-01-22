import { type t } from './common.ts';
import { Assets } from './m.io.Assets.ts';
import { Playback } from './m.io.Playback.ts';
import { SlugUrl } from './m.Url.ts';

export const Bundle: t.SlugClientBundleLib = {
  load,
};

async function load<P = unknown>(
  baseUrl: t.StringUrl,
  docid: t.StringId,
  opts?: t.SlugLoadOptions,
): Promise<t.SlugClientResult<t.SpecTimelineBundle<P>>> {
  const assetsResult = await Assets.load(baseUrl, docid, opts);
  if (!assetsResult.ok) return { ok: false, error: assetsResult.error };

  const playbackResult = await Playback.load<P>(baseUrl, docid, opts);
  if (!playbackResult.ok) return { ok: false, error: playbackResult.error };

  const cleanedDocid = SlugUrl.clean(docid);
  const hrefBase = new URL(opts?.baseHref ?? baseUrl);
  const baseOrigin = hrefBase.origin;
  const basePath = hrefBase.pathname.replace(/\/$/, '');
  const normalizeHref = (href: string) => {
    if (SlugUrl.isAbsoluteHref(href)) return href;
    if (href.startsWith('/')) return new URL(`${basePath}${href}`, baseOrigin).toString();
    return new URL(href, hrefBase.href).toString();
  };

  const assetMap = new Map<string, t.SpecTimelineAsset>();
  for (const asset of assetsResult.value.assets) {
    const normalized: t.SpecTimelineAsset = { ...asset, href: normalizeHref(asset.href) };
    assetMap.set(`${asset.kind}:${asset.logicalPath}`, normalized);
  }

  const resolveAsset = (opts: t.Timecode.Playback.ResolverArgs) => {
    return assetMap.get(`${opts.kind}:${opts.logicalPath}`);
  };

  const bundle: t.SpecTimelineBundle<P> = {
    docid: cleanedDocid,
    spec: { composition: playbackResult.value.composition, beats: playbackResult.value.beats },
    resolveAsset,
  };

  return { ok: true, value: bundle };
}
