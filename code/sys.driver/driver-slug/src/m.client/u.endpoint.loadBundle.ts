import { loadAssets } from './u.endpoint.loadAssets.ts';
import { loadPlayback } from './u.endpoint.loadPlayback.ts';

import type { t } from './common.ts';
import { SlugUrl } from './m.Url.ts';

export async function loadBundle<P = unknown>(
  baseUrl: t.StringUrl,
  docid: t.StringId,
  opts?: t.SlugLoadOptions,
): Promise<t.Result<t.SpecTimelineBundle<P>>> {
  const assetsResult = await loadAssets(baseUrl, docid, opts?.init);
  if (!assetsResult.ok) return { ok: false, error: assetsResult.error };

  const playbackResult = await loadPlayback<P>(baseUrl, docid, opts?.init);
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
    const normalized: t.SpecTimelineAsset = {
      ...asset,
      href: normalizeHref(asset.href),
    };
    assetMap.set(`${asset.kind}:${asset.logicalPath}`, normalized);
  }

  const resolveAsset = (opts: t.Timecode.Playback.ResolverArgs) =>
    assetMap.get(`${opts.kind}:${opts.logicalPath}`);

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
