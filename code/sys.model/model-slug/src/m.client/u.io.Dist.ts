import { D, Pkg, SlugUrl, type t } from './common.ts';
import { fetchJson } from './u.fetch.ts';

type CacheKey = string;
type Cache = {
  readonly generation: number;
  readonly values: Map<CacheKey, Promise<t.SlugClientResult<t.DistPkg>>>;
};

const caches = new WeakMap<t.HttpFetch.Instance, Cache>();
let cacheGeneration = 0;
const invalidate = (_baseUrl: t.StringUrl) => void cacheGeneration++;

export const Dist = {
  load,
  hasPart,
  invalidate,
};

async function load(
  baseUrl: t.StringUrl,
  opts: t.SlugLoadOptions,
): Promise<t.SlugClientResult<t.DistPkg>> {
  const manifests = SlugUrl.Composition.manifestsLocation(baseUrl, opts);
  const manifestsBaseUrl = manifests.baseUrl;
  const manifestsDir = manifests.manifestsDir;
  const key = `${manifestsBaseUrl}|${manifestsDir}`;
  const cache = getCache(opts.client);
  let promise = cache?.values.get(key);
  if (!promise) {
    promise = (async () => {
      const url = SlugUrl.Composition.manifests({
        baseUrl: manifestsBaseUrl,
        manifestsDir,
        filename: 'dist.json',
      });

      const req: t.HttpFetch.Init = { ...D.CACHE_INIT, ...(opts?.init ?? {}) };
      req.cache = D.CACHE_INIT.cache;

      const res = await fetchJson<unknown>(url, req, opts);
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
            message: `dist.json failed validation @ ${res.finalUrl}`,
          },
        };
      }

      return { ok: true, value: data };
    })();
    cache?.values.set(key, promise);
  }

  const result = await promise;
  if (!result.ok) cache?.values.delete(key);
  return result;
}

/**
 * Helpers:
 */
function getCache(client?: t.HttpFetch.Instance): Cache | undefined {
  if (!client) return undefined;

  const current = caches.get(client);
  if (current?.generation === cacheGeneration) return current;

  const next: Cache = { generation: cacheGeneration, values: new Map() };
  caches.set(client, next);
  return next;
}

function hasPart(dist: t.DistPkg, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(dist.hash.parts, key);
}
