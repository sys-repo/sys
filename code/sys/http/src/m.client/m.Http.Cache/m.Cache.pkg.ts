declare var self: ServiceWorkerGlobalScope;
import { type t, Str } from './common.ts';

export const pkg: t.HttpCacheLib['pkg'] = async (args) => {
  const { pkg, silent = false } = args;

  const CACHE_ASSETS = `${pkg.name}:asset-files`;
  const CACHE_MEDIA = `${pkg.name}:media-files`;

  const HASHED_ASSET = /\/pkg\/[^/]+\.[A-Za-z0-9_-]{8,}\.\w+$/i;
  const MEDIA_EXT = /\.(mp4|m4v|mov|webm)$/i;

  if (!silent)
    console.info(`💦 [service-worker] starting Http.Cache: ${pkg.name} ${pkg.version}`, {
      CACHE_ASSETS,
      CACHE_MEDIA,
    });

  /**
   * Installation: instruct the new Service Worker to skip the waiting phase
   * and activate immediately (replacing any older worker without requiring a reload).
   */
  self.skipWaiting();

  /**
   * Activation: claim clients immediately and purge stale caches.
   *
   * Keeps only the current asset/media caches (freeing space and preventing
   * outdated responses) by deleting any other previously versioned cache names.
   */
  self.addEventListener('activate', (e) => {
    const claimAndClean = async () => {
      await self.clients.claim();
      const keep = new Set([CACHE_ASSETS, CACHE_MEDIA]);
      for (const name of await caches.keys()) {
        if (!keep.has(name)) await caches.delete(name);
      }
    };

    e.waitUntil(claimAndClean());
  });

  /**
   * Fetch handler: intercepts GET requests.
   * - Media with a Range header → serve partial bytes from cached full file.
   * - Hashed build assets → cache-first lookup.
   * Other requests pass through untouched.
   */
  self.addEventListener('fetch', (e) => {
    const { request } = e;
    if (request.method !== 'GET') return;
    const { pathname } = new URL(request.url);

    if (request.headers.has('Range') && MEDIA_EXT.test(pathname)) {
      e.respondWith(rangeResponse(request));
      return;
    }
    if (HASHED_ASSET.test(pathname)) {
      e.respondWith(assetResponse(request));
    }
  });

  /**
   * Cache-first strategy for immutable, hash-named bundle assets
   * emitted by Vite (js, css, wasm, ...).
   */
  async function assetResponse(request: Request): Promise<Response> {
    const key = request.url;
    const cached = await caches.match(key);
    if (cached) {
      if (!silent) console.info(`🌼 asset cache hit: ${key}`);
      return cached;
    }

    const response = await fetch(request);
    if (response.ok && (response.type === 'basic' || response.type === 'cors')) {
      const cache = await caches.open(CACHE_ASSETS);
      cache.put(key, response.clone());
    }
    return response;
  }

  /**
   * Serves byte-range requests from a local cache.
   *    First request downloads and stores **the entire media file**.
   *    Subsequent range requests are fulfilled by slicing the cached
   *    ArrayBuffer and returning a synthetic 206 response.
   */
  async function rangeResponse(request: Request): Promise<Response> {
    const range = request.headers.get('Range');
    if (!range || !range.startsWith('bytes=')) return fetch(request);

    const url = request.url;
    const cache = await caches.open(CACHE_MEDIA);
    let full = await cache.match(url);

    // First encounter → fetch whole object and store.
    if (!full) {
      const network = await fetch(url, { method: 'GET', mode: 'cors' });
      if (!network.ok) return network;
      full = await cacheFullMedia(url, network);
    }

    const size = Number(full.headers.get('Content-Length'));
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    const start = Number(startStr);
    const end = endStr ? Number(endStr) : size - 1;

    // Guard: invalid range on cached copy:
    if (isNaN(start) || isNaN(end) || start > end || end >= size) {
      // Cached object is stale or truncated → purge and fall back to network.
      await cache.delete(url);
      if (!silent) console.info(`🧹 purged stale media cache, retrying: ${url}`);

      // Forward the original request (includes the same Range header).
      // The fresh 206 (or 200) will stream from network and may be cached again.
      return fetch(request);
    }

    const data = await full.arrayBuffer();
    const slice = data.slice(start, end + 1);
    const length = slice.byteLength;

    if (!silent) {
      const bytes = `bytes: ${start}-${end}:${size}, ${Str.bytes(size)}`;
      console.info(`🌸 media cache hit: ${bytes} • ${url}`);
    }

    return new Response(slice, {
      status: 206,
      statusText: 'Partial Content',
      headers: {
        'Content-Type': full.headers.get('Content-Type') ?? 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Content-Length': String(length),
        'Content-Range': `bytes ${start}-${end}/${size}`,
      },
    });
  }

  /**
   * Read the body once, compute its length,
   * and cache a Response built from the bytes.
   */
  async function cacheFullMedia(url: string, full: Response): Promise<Response> {
    const buffer = await full.arrayBuffer(); // consume once:
    const size = buffer.byteLength;
    const headers = new Headers(full.headers);

    // Force explicit byte length + serveable range semantics:
    headers.set('Content-Length', String(size));
    headers.set('Accept-Ranges', 'bytes');

    // Build a fresh immutable Response from the full bytes:
    const stored = new Response(buffer, {
      status: 200, // Treat as full object (even if origin 206 - "partial content").
      statusText: 'OK',
      headers,
    });

    const cache = await caches.open(CACHE_MEDIA);
    await cache.put(url, stored.clone());

    if (!silent) console.info(`✅ cached full media (${size.toLocaleString()} bytes): ${url}`);
    return stored;
  }
};
