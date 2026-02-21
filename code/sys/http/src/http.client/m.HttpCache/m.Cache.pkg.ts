declare var self: ServiceWorkerGlobalScope;
import { type t, Str } from './common.ts';

export type MediaFullResponseCandidate = {
  readonly status: number;
  readonly contentRange?: string | null;
  readonly contentLength?: number;
  readonly bodySize: number;
};

export type RangeWindowCandidateInput = {
  readonly status: number;
  readonly request: { start: number; end?: number };
  readonly contentRange?: string | null;
  readonly policy: t.HttpCacheMediaPolicy;
};

export function resolveMediaPolicy(
  input: t.HttpCacheMediaPolicyInput | undefined,
): t.HttpCacheMediaPolicy {
  const mode = input?.mode ?? 'safe-full';
  return {
    mode,
    maxChunkBytes: wrangle.positive(input?.maxChunkBytes, 5 * 1024 * 1024),
    maxObjectBytes: wrangle.positive(input?.maxObjectBytes, 512 * 1024 * 1024),
    maxTotalBytes: wrangle.positive(input?.maxTotalBytes, 1024 * 1024 * 1024),
    ttlMs: wrangle.positive(input?.ttlMs, 1000 * 60 * 60 * 24),
  };
}

export function shouldBypassMediaCache(mode: t.HttpCacheMediaMode): boolean {
  return mode === 'off';
}

export function isRangeWindowCacheCandidate(input: RangeWindowCandidateInput) {
  if (input.status !== 206) return { ok: false, reason: `status:${input.status}` } as const;
  const contentRange = input.contentRange;
  if (!contentRange) return { ok: false, reason: 'missing-content-range' } as const;
  const parsed = wrangle.contentRange(contentRange);
  if (!parsed) return { ok: false, reason: 'invalid-content-range' } as const;

  const { request, policy } = input;
  if (parsed.from !== request.start) return { ok: false, reason: 'range-start-mismatch' } as const;
  if (typeof request.end === 'number' && parsed.to !== request.end) {
    return { ok: false, reason: 'range-end-mismatch' } as const;
  }

  const bytes = parsed.to - parsed.from + 1;
  if (bytes <= 0) return { ok: false, reason: 'empty-range' } as const;
  if (bytes > policy.maxChunkBytes) return { ok: false, reason: 'chunk-too-large' } as const;
  if (parsed.total > policy.maxObjectBytes) return { ok: false, reason: 'object-too-large' } as const;

  return { ok: true, parsed, bytes } as const;
}

export const pkg: t.HttpCacheLib['pkg'] = async (args) => {
  const { pkg, silent = false } = args;
  const media = resolveMediaPolicy(args.media);

  const CACHE_ASSETS = `${pkg.name}:asset-files`;
  const CACHE_MEDIA = `${pkg.name}:media-files`;
  const CACHE_MEDIA_RANGE = `${pkg.name}:media-range-files`;

  const HASHED_ASSET = /\/pkg\/[^/]+\.[A-Za-z0-9_-]{8,}\.\w+$/i;
  const MEDIA_EXT = /\.(mp4|m4v|mov|webm)$/i;

  if (!silent)
    console.info(`💦 [service-worker] starting Http.Cache: ${pkg.name} ${pkg.version}`, {
      CACHE_ASSETS,
      CACHE_MEDIA,
      CACHE_MEDIA_RANGE,
      media,
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
      const keep = new Set([CACHE_ASSETS, CACHE_MEDIA, CACHE_MEDIA_RANGE]);
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
      e.respondWith(mediaResponse(request));
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
   * Routes media requests to a configured cache strategy.
   */
  function mediaResponse(request: Request): Promise<Response> {
    if (shouldBypassMediaCache(media.mode)) return mediaOffResponse(request);

    switch (media.mode) {
      case 'range-window':
        return mediaRangeWindowResponse(request);
      case 'safe-full':
      default:
        return mediaSafeFullResponse(request);
    }
  }

  /**
   * Media strategy: no SW media caching.
   */
  function mediaOffResponse(request: Request): Promise<Response> {
    return fetch(request);
  }

  /**
   * Media strategy: placeholder for bounded chunk cache.
   * Phase-1 keeps behavior equivalent to safe-full.
   */
  function mediaRangeWindowResponse(request: Request): Promise<Response> {
    return mediaRangeChunkResponse(request);
  }

  async function mediaRangeChunkResponse(request: Request): Promise<Response> {
    const rangeValue = request.headers.get('Range');
    const requestRange = wrangle.requestRange(rangeValue);
    if (!requestRange) return fetch(request);

    const cache = await caches.open(CACHE_MEDIA_RANGE);
    const key = wrangle.rangeKey(request.url, requestRange);
    const cached = await cache.match(key);
    if (cached) {
      const meta = wrangle.entryMeta(cached.headers);
      if (meta && meta.expiresAt <= Date.now()) {
        await cache.delete(key);
        await rangeMeta.remove(cache, key);
      } else {
        await rangeMeta.touch(cache, key, Date.now());
        if (!silent) console.info(`🟢 media range cache hit: ${requestRange.start}-${requestRange.end ?? ''} • ${request.url}`);
        return cached;
      }
    }

    const network = await fetch(request);
    const candidate = isRangeWindowCacheCandidate({
      status: network.status,
      request: requestRange,
      contentRange: network.headers.get('Content-Range'),
      policy: media,
    });
    if (!candidate.ok) {
      if (!silent) console.info(`🧪 skip range cache (${candidate.reason}): ${request.url}`);
      return network;
    }

    const now = Date.now();
    await rangeMeta.evict(cache, media, now, candidate.bytes);
    const expiresAt = now + media.ttlMs;
    const stored = wrangle.withEntryMeta(network.clone(), {
      createdAt: now,
      lastAccessAt: now,
      expiresAt,
      bytes: candidate.bytes,
    });

    await cache.put(key, stored);
    await rangeMeta.upsert(cache, {
      key,
      bytes: candidate.bytes,
      createdAt: now,
      lastAccessAt: now,
      expiresAt,
    });
    if (!silent) {
      const parsed = candidate.parsed;
      console.info(`🧩 cached media range: ${parsed.from}-${parsed.to}/${parsed.total} • ${request.url}`);
    }
    return network;
  }

  /**
   * Serves byte-range requests from a local cache.
   *    First request downloads and stores **the entire media file**.
   *    Subsequent range requests are fulfilled by slicing the cached
   *    ArrayBuffer and returning a synthetic 206 response.
   */
  async function mediaSafeFullResponse(request: Request): Promise<Response> {
    const range = request.headers.get('Range');
    if (!range || !range.startsWith('bytes=')) return fetch(request);

    const url = request.url;
    const cache = await caches.open(CACHE_MEDIA);
    let full = await cache.match(url);

    // First encounter → fetch whole object and store.
    if (!full) {
      const network = await fetch(url, { method: 'GET', mode: 'cors', cache: 'no-store' });
      if (!network.ok) return network;
      full = await cacheFullMedia(url, network);
      if (!full) return fetch(request);
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
      console.info(`🌺 media cache hit: ${bytes} • ${url}`);
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
  async function cacheFullMedia(url: string, full: Response): Promise<Response | undefined> {
    const buffer = await full.arrayBuffer(); // consume once:
    const size = buffer.byteLength;

    const headers = new Headers(full.headers);
    const contentLengthRaw = Number(headers.get('Content-Length'));
    const contentLength =
      Number.isFinite(contentLengthRaw) && contentLengthRaw > 0 ? contentLengthRaw : undefined;
    const check = isSafeFullMediaCandidate({
      status: full.status,
      contentRange: headers.get('Content-Range'),
      contentLength,
      bodySize: size,
    });
    if (!check.ok) {
      if (!silent) {
        console.info(`🧪 skip media cache (${check.reason}): ${url}`);
      }
      return undefined;
    }

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

export function isSafeFullMediaCandidate(input: MediaFullResponseCandidate) {
  if (input.status !== 200) return { ok: false, reason: `status:${input.status}` } as const;
  if (input.bodySize <= 0) return { ok: false, reason: 'empty-body' } as const;
  if (typeof input.contentLength === 'number' && input.contentLength !== input.bodySize) {
    return { ok: false, reason: `length-mismatch:${input.contentLength}!=${input.bodySize}` } as const;
  }

  if (input.contentRange) {
    const parsed = wrangle.contentRange(input.contentRange);
    if (!parsed || parsed.from !== 0 || parsed.to + 1 !== parsed.total) {
      return { ok: false, reason: 'partial-content-range' } as const;
    }
  }

  return { ok: true } as const;
}

const wrangle = {
  positive(input: number | undefined, fallback: number): number {
    const value = Number(input);
    if (!Number.isFinite(value) || value <= 0) return fallback;
    return Math.floor(value);
  },

  requestRange(input: string | null): { start: number; end?: number } | undefined {
    if (!input || !input.startsWith('bytes=')) return undefined;
    const [startStr, endStr] = input.replace(/bytes=/, '').split('-');
    const start = Number(startStr);
    const endRaw = endStr ? Number(endStr) : undefined;
    if (!Number.isFinite(start) || start < 0) return undefined;
    if (typeof endRaw === 'number' && (!Number.isFinite(endRaw) || endRaw < start)) return undefined;
    return typeof endRaw === 'number' ? { start, end: endRaw } : { start };
  },

  rangeKey(url: string, range: { start: number; end?: number }): string {
    return `${url}::bytes=${range.start}-${range.end ?? ''}`;
  },

  withEntryMeta(
    response: Response,
    meta: { createdAt: number; lastAccessAt: number; expiresAt: number; bytes: number },
  ): Response {
    const headers = new Headers(response.headers);
    headers.set('x-sys-cache-created-at', String(meta.createdAt));
    headers.set('x-sys-cache-last-access-at', String(meta.lastAccessAt));
    headers.set('x-sys-cache-expires-at', String(meta.expiresAt));
    headers.set('x-sys-cache-bytes', String(meta.bytes));
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },

  entryMeta(headers: Headers): { createdAt: number; lastAccessAt: number; expiresAt: number; bytes: number } | undefined {
    const createdAt = Number(headers.get('x-sys-cache-created-at'));
    const lastAccessAt = Number(headers.get('x-sys-cache-last-access-at'));
    const expiresAt = Number(headers.get('x-sys-cache-expires-at'));
    const bytes = Number(headers.get('x-sys-cache-bytes'));
    if (!Number.isFinite(createdAt) || !Number.isFinite(lastAccessAt)) return undefined;
    if (!Number.isFinite(expiresAt) || !Number.isFinite(bytes)) return undefined;
    return { createdAt, lastAccessAt, expiresAt, bytes };
  },

  /**
   * Parse RFC 9110 byte Content-Range values:
   *   bytes <from>-<to>/<total>
   */
  contentRange(input: string): { from: number; to: number; total: number } | undefined {
    const match = input.match(/^bytes\s+(\d+)-(\d+)\/(\d+)$/i);
    if (!match) return undefined;
    const from = Number(match[1]);
    const to = Number(match[2]);
    const total = Number(match[3]);
    if (!Number.isFinite(from) || !Number.isFinite(to) || !Number.isFinite(total)) return undefined;
    if (from < 0 || to < from || total <= 0 || to >= total) return undefined;
    return { from, to, total };
  },
} as const;

type RangeMetaEntry = {
  key: string;
  bytes: number;
  createdAt: number;
  lastAccessAt: number;
  expiresAt: number;
};
type RangeMetaIndex = {
  entries: Record<string, RangeMetaEntry>;
};

const rangeMeta = {
  KEY: '__sys_http_media_range_meta__',

  async read(cache: Cache): Promise<RangeMetaIndex> {
    const res = await cache.match(rangeMeta.KEY);
    if (!res) return { entries: {} };
    try {
      const json = (await res.json()) as RangeMetaIndex;
      if (!json || typeof json !== 'object' || !json.entries) return { entries: {} };
      return json;
    } catch {
      return { entries: {} };
    }
  },

  async write(cache: Cache, index: RangeMetaIndex): Promise<void> {
    await cache.put(
      rangeMeta.KEY,
      new Response(JSON.stringify(index), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
  },

  async upsert(cache: Cache, entry: RangeMetaEntry): Promise<void> {
    const index = await rangeMeta.read(cache);
    index.entries[entry.key] = entry;
    await rangeMeta.write(cache, index);
  },

  async remove(cache: Cache, key: string): Promise<void> {
    const index = await rangeMeta.read(cache);
    delete index.entries[key];
    await rangeMeta.write(cache, index);
  },

  async touch(cache: Cache, key: string, now: number): Promise<void> {
    const index = await rangeMeta.read(cache);
    const entry = index.entries[key];
    if (!entry) return;
    entry.lastAccessAt = now;
    await rangeMeta.write(cache, index);
  },

  async evict(
    cache: Cache,
    policy: t.HttpCacheMediaPolicy,
    now: number,
    incomingBytes: number,
  ): Promise<void> {
    const index = await rangeMeta.read(cache);
    const keys = Object.keys(index.entries);

    // Repair stale index rows.
    for (const key of keys) {
      if (key === rangeMeta.KEY) continue;
      const exists = await cache.match(key);
      if (!exists) delete index.entries[key];
    }

    // TTL sweep.
    for (const key of Object.keys(index.entries)) {
      const entry = index.entries[key];
      if (entry.expiresAt > now) continue;
      await cache.delete(key);
      delete index.entries[key];
    }

    const totalBytes = () => Object.values(index.entries).reduce((acc, next) => acc + next.bytes, 0);
    let total = totalBytes();
    if (total + incomingBytes <= policy.maxTotalBytes) {
      await rangeMeta.write(cache, index);
      return;
    }

    const rows = Object.values(index.entries).sort((a, b) => a.lastAccessAt - b.lastAccessAt);
    for (const entry of rows) {
      if (total + incomingBytes <= policy.maxTotalBytes) break;
      await cache.delete(entry.key);
      delete index.entries[entry.key];
      total -= entry.bytes;
    }

    await rangeMeta.write(cache, index);
  },
} as const;
