declare var self: ServiceWorkerGlobalScope;
import { pkg } from '../pkg.ts';

import { cacheVideos } from '../worker.service/cache.video.ts';
// cacheVideos({ silent: false, log: ['Requests'] });

/**
 * Ensure the service-worker takes control of all clients immediately.
 */
self.skipWaiting();

// Info:
const prefix = '🐷 [service-worker]';
console.info(`${prefix} -sw.ts:`, pkg);
