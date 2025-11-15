/**
 * @module
 * Safe: CRDT repository setup for web/workers.
 * No UI modules leak into this boundary.
 */
import { Crdt } from '../-exports/-web/mod.ts';
import { Url } from '@sys/std';

export { Crdt };

/**
 * Create "dev" CRDT repository instance:
 */
export function createRepo() {
  const qsSyncServer = Url.parse(location.href).toURL().searchParams.get('ws');
  const isLocalhost = location.hostname === 'localhost';
  const isDev = isLocalhost && location.port !== '8080';

  const repo = Crdt.repo({
    storage: { database: 'dev.crdt' },
    network: [
      { ws: 'waiheke.sync.db.team' },
      // { ws: 'sync.db.team' },
      isDev && { ws: 'localhost:3030' },
      qsSyncServer && { ws: qsSyncServer },
    ],
  });

  return repo;
}
