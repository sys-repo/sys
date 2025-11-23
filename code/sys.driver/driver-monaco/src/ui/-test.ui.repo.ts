import { Crdt, Url } from './common.ts';

/**
 * Create "dev" CRDT repository instance:
 */
export function createUiRepo() {
  const qs = Url.parse(location.href).toURL().searchParams.get('ws');
  const isLocalhost = location.hostname === 'localhost';
  const isDev = isLocalhost && location.port !== '8080';

  const repo = Crdt.repo({
    storage: { database: 'dev.crdt' },
    network: [
      qs && { ws: qs },
      !qs && isDev && { ws: 'localhost:3030' },
      !qs && !isDev && { ws: 'waiheke.sync.db.team' },
    ],
  });

  return repo;
}
