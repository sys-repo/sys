declare var self: ServiceWorkerGlobalScope;
import { pkg } from '../pkg.ts';

/**
 * Ensure the service-worker takes control of all clients immediately.
 */
self.skipWaiting();

// Info:
const prefix = '🐷 [service-worker]';
console.info(`${prefix} -sw.ts:`, pkg);
