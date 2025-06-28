declare var self: ServiceWorkerGlobalScope;
import { pkg } from '../pkg.ts';

/**
 * One permanent cache for all immutable, hash-named bundle files.
 * (No version suffix → files with identical names stay forever.)
 */
const CACHE = 'byte-assets' as const;

/**
 * Files emitted by Vite look like:
 *   /pkg/m.XOnTrOh4.js
 *   /pkg/a.BnEcDK_c.wasm
 *   /pkg/-entry.DJ2ZDeEQ.js
 *   /pkg/m.2CvxsZQK.css
 *
 * Rule:
 *   • must live under "/pkg/"
 *   • have *any* base name
 *   • a dot-separated "hash" ≥ 8 chars (letters, digits, "_" or "-")
 *   • a final extension (js, css, wasm, etc.)
 */
const HASHED_ASSET = /\/pkg\/[^/]+\.[A-Za-z0-9_-]{8,}\.\w+$/i;

/**
 * Take control immediately so the fresh SW serves without a reload.
 */
self.skipWaiting();

/**
 * Claim all pages as soon as we activate.
 * No cache cleanup – hashed files are immortal.
 */
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

/**
 * Cache-first strategy for immutable bundle assets:
 * 1. Try every cache in Storage for a match.
 * 2. If absent, fetch from network, then stash in `byte-assets`.
 */
self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const { pathname } = new URL(request.url);
  if (!HASHED_ASSET.test(pathname)) return; // ignore HTML, API, etc.

  e.respondWith(
    (async () => {
      // step-1: any cache hit?
      const cached = await caches.match(request);
      if (cached) {
        console.info(`🌼 cache match: ${request.url}`);
        return cached;
      }

      // step-2: fetch + stash
      const response = await fetch(request);
      if (response.ok && (response.type === 'basic' || response.type === 'cors')) {
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
      }
      return response;
    })(),
  );
});

/**
 * Alert:
 */
console.info('💦 [service-worker] -sw.ts:', pkg);
