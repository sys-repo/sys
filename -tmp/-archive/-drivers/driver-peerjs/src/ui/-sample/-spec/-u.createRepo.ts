import { Crdt, Url } from '../common.ts';

/**
 * crdt: @sys/driver-automerge
 */
export function createRepo() {
  const qs = Url.parse(location.href).toURL().searchParams.get('ws');
  const isLocalhost = location.hostname === 'localhost';

  const repo = Crdt.repo({
    storage: { database: 'dev.crdt' },
    network: [
      //
      { ws: 'waiheke.sync.db.team' },
      // { ws: 'sync.db.team' },
      // { ws: 'crdtsync.dbteam.deno.net' },
      isLocalhost && { ws: 'localhost:3030' },
      qs && { ws: qs },
    ],
  });

  return repo;
}
