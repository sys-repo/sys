declare var self: ServiceWorkerGlobalScope;
import { pkg } from '../pkg.ts';
import { Http } from '@sys/http/client';

/**
 * Ensure the service-worker takes control of all clients immediately.
 */
self.skipWaiting();

/**
 * Start the HTTP pkg/bundle cache.
 */
Http.Cache.pkg({ pkg });

Http.Cache.Cmd.listen({
  target: self,
  silent: false,
  clear: async (_payload) => {
    return {
      ok: true,
      deleted: [],
      total: 0,
      at: Date.now(),
    };
  },
});
