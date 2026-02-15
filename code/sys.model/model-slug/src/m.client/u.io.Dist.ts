import { type t, D, Http, Pkg, SlugUrl } from './common.ts';

type CacheKey = string;
const cache = new Map<CacheKey, Promise<t.SlugClientResult<t.DistPkg>>>();
const invalidate = (_baseUrl: t.StringUrl) => cache.clear();

export const Dist = {
  load,
  hasPart,
  invalidate,
};

async function load(
  baseUrl: t.StringUrl,
  opts?: t.SlugLoadOptions,
): Promise<t.SlugClientResult<t.DistPkg>> {
  const manifests = SlugUrl.Composition.manifestsLocation(baseUrl, opts);
  const manifestsBaseUrl = manifests.baseUrl;
  const manifestsDir = manifests.manifestsDir;
  const key = `${manifestsBaseUrl}|${manifestsDir}`;
  let promise = cache.get(key);
  if (!promise) {
    promise = (async () => {
      const fetch = Http.fetcher();
      const url = SlugUrl.Composition.manifests({
        baseUrl: manifestsBaseUrl,
        manifestsDir,
        filename: 'dist.json',
      });

      const req: RequestInit = { ...D.CACHE_INIT, ...(opts?.init ?? {}) };
      req.cache = D.CACHE_INIT.cache;

      const res = await fetch.json<unknown>(url, req);
      if (!res.ok) {
        return {
          ok: false,
          error: {
            kind: 'http',
            message: `dist.json fetch failed. ${res.status} ${res.statusText} @ ${res.url ?? url}`,
            status: res.status,
            statusText: res.statusText,
            url: res.url ?? url,
          },
        };
      }

      const data = res.data;
      if (!Pkg.Is.dist(data)) {
        return {
          ok: false,
          error: {
            kind: 'schema',
            message: `dist.json failed validation @ ${res.url ?? url}`,
          },
        };
      }

      return { ok: true, value: data };
    })();
    cache.set(key, promise);
  }
  return promise;
}

/**
 * Helpers:
 */
function hasPart(dist: t.DistPkg, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(dist.hash.parts, key);
}
