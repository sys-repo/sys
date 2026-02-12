declare var self: ServiceWorkerGlobalScope;
import { Http } from '@sys/http/client';
import { pkg } from '../pkg.ts';

/**
 * Ensure the service-worker takes control of all clients immediately.
 */
self.skipWaiting();

/**
 * Start the HTTP pkg/bundle cache.
 */
console.info('[-sw.ts] Http.Cache.pkg({ pkg }):', import.meta);
Http.Cache.pkg({ pkg });
Http.Cache.Cmd.listen({
  target: self,
  silent: false,
  ...Http.Cache.Cmd.Handlers.all({ pkg }),
});
