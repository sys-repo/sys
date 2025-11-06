declare var self: ServiceWorkerGlobalScope;
import { Http } from '@sys/http/client';
import { pkg } from '../pkg.ts';

/**
 * Ensure the service-worker takes control of all clients immediately.
 */
self.skipWaiting();

/**
 * Start the standard HTTP pkg/bundle cache.
 */
console.info('[-sw.ts] Http.Cache.pkg({ pkg }):', import.meta);
Http.Cache.pkg({ pkg });
