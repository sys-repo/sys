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
Http.Cache.pkg({ pkg });
