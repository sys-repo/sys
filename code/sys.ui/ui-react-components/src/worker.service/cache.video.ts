declare var self: ServiceWorkerGlobalScope;

import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { RangeRequestsPlugin } from 'workbox-range-requests';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';

type Log = 'Requests';

export async function cacheVideos(
  options: { maxEntries?: number; maxAgeSeconds?: number; silent?: boolean; log?: Log[] } = {},
) {
  const {
    maxEntries = 30,
    maxAgeSeconds = 7 * 24 * 60 * 60, // 1-week.
    silent,
    log = [],
  } = options;

  const prefix = `🌳 [service-worker]`;
  const statuses = [200];

  if (!silent) {
    console.groupCollapsed(`${prefix} setup: cache videos`);
    console.info(`   - maxAge (seconds):`, maxAgeSeconds);
    console.info(`   - maxEntries:`, maxEntries);
    console.info(`   - allow HTTP status codes:`, statuses);
    console.groupEnd();
  }

  registerRoute(
    ({ request }) => {
      const isVideo = request.destination === 'video';
      if (isVideo && !silent && log.includes('Requests')) {
        console.info(`${prefix} route/video:`, request);
      }
      return isVideo;
    },
    new CacheFirst({
      cacheName: 'videos',
      plugins: [
        new CacheableResponsePlugin({ statuses }),
        new ExpirationPlugin({ maxEntries, maxAgeSeconds }),
        new RangeRequestsPlugin(),
      ],
    }),
  );

  // Ensure the service-worker takes control of all clients immediately.
  clientsClaim();
  await self.skipWaiting();
}
