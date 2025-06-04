declare var self: ServiceWorkerGlobalScope;
import { cacheVideos } from '../worker.service/cache.video.ts';

// cacheVideos({ silent: false, log: ['Requests'] });

// Ensure the service-worker takes control of all clients immediately.
await self.skipWaiting();
