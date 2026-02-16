import { type t, Is, SlugClient, Url } from './common.ts';

/**
 * Media deploys serve stream assets from `origin.cdn.video`.
 * Keep this policy in the loader seam so consumers get canonicalized hrefs.
 */
export function withVideoShardRewrite(
  client: t.SlugClientDescriptor,
  origin: t.SlugUrlOrigin,
): t.SlugClientDescriptor {
  if (client.kind !== 'slug-tree:media:seq') return client;

  const withAssetBase = <T extends t.SlugLoadOptions>(options?: T): T => {
    const value = {
      ...(options ?? {}),
      urls: {
        ...(options?.urls ?? {}),
        assetBase: options?.urls?.assetBase ?? origin.cdn.video,
      },
    };
    return value as T;
  };

  const mergeLayout = (options?: t.SlugLoadOptions): t.SlugClientLayout | undefined => {
    const value = {
      ...(client.layout ?? {}),
      ...(options?.layout ?? {}),
    };
    return Object.keys(value).length > 0 ? value : undefined;
  };

  const rewriteAssetHref = (asset: t.SpecTimelineAsset, options?: t.SlugLoadOptions): string => {
    const href = toAbsoluteHref(asset.href, origin.cdn.video);
    return SlugClient.Url.Composition.rewriteShardHost({
      href,
      asset,
      layout: mergeLayout(options),
    });
  };

  return {
    ...client,
    Timeline: {
      ...client.Timeline,
      Assets: {
        async load(options) {
          const result = await client.Timeline.Assets.load(withAssetBase(options));
          if (!result.ok) return result;

          const assets = result.value.assets.map((asset) => ({
            ...asset,
            href: rewriteAssetHref(asset, options),
          }));
          return { ok: true, value: { ...result.value, assets } };
        },
      },
      Bundle: {
        load: (options) => client.Timeline.Bundle.load(withAssetBase(options)),
      },
    },
  };
}

function toAbsoluteHref(href: string, base: t.StringUrl): string {
  const raw: unknown = href;
  if (Is.urlString(raw)) return raw;

  const value = String(raw ?? '').trim();
  if (!value) return value;

  const path = value.replace(/^\//, '');
  return Url.parse(base).join(path);
}
