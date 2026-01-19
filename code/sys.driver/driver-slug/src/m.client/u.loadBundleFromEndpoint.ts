import { loadAssetsFromEndpoint } from './u.loadAssetsFromEndpoint.ts';
import { loadPlaybackFromEndpoint } from './u.loadPlaybackFromEndpoint.ts';

import type { t } from './common.ts';
import type { LoadBundleArgs, Result, SpecTimelineAsset, SpecTimelineBundle } from './t.ts';
import { SlugUrl } from './m.Url.ts';

const isAbsolute = (href: string) => href.startsWith('http://') || href.startsWith('https://');

export async function loadBundleFromEndpoint<P = unknown>(
  baseUrl: t.StringUrl,
  docid: t.StringId,
  args?: LoadBundleArgs,
): Promise<Result<SpecTimelineBundle<P>>> {
  const assetsResult = await loadAssetsFromEndpoint(baseUrl, docid, args?.init);
  if (!assetsResult.ok) return { ok: false, error: assetsResult.error };

  const playbackResult = await loadPlaybackFromEndpoint<P>(baseUrl, docid, args?.init);
  if (!playbackResult.ok) return { ok: false, error: playbackResult.error };

  const cleanedDocid = SlugUrl.clean(docid);
  const hrefBase = new URL(args?.baseHref ?? baseUrl);
  const baseOrigin = hrefBase.origin;
  const basePath = hrefBase.pathname.replace(/\/$/, '');
  const normalizeHref = (href: string) => {
    if (isAbsolute(href)) return href;
    if (href.startsWith('/')) return new URL(`${basePath}${href}`, baseOrigin).toString();
    return new URL(href, hrefBase.href).toString();
  };

  const assetMap = new Map<string, SpecTimelineAsset>();
  for (const asset of assetsResult.value.assets) {
    const normalized: SpecTimelineAsset = {
      ...asset,
      href: normalizeHref(asset.href),
    };
    assetMap.set(`${asset.kind}:${asset.logicalPath}`, normalized);
  }

  const resolveAsset = (args: t.Timecode.Playback.ResolverArgs) =>
    assetMap.get(`${args.kind}:${args.logicalPath}`);

  const bundle: SpecTimelineBundle<P> = {
    docid: cleanedDocid,
    spec: {
      composition: playbackResult.value.composition,
      beats: playbackResult.value.beats,
    },
    resolveAsset,
  };

  return { ok: true, value: bundle };
}
