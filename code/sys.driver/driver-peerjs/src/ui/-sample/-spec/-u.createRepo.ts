import { Crdt, Url } from '../common.ts';

/**
 * crdt: @sys/driver-automerge
 */
export function createRepo() {
  const qsSyncServer = Url.parse(location.href).toURL().searchParams.get('ws');
  const isLocalhost = location.hostname === 'localhost';

  const repo = Crdt.repo({
    storage: { database: 'dev:sys.crdt' },
    network: [
      //
      { ws: 'waiheke.sync.db.team' },
      // { ws: 'sync.db.team' },
      // { ws: 'crdtsync.dbteam.deno.net' },
      isLocalhost && { ws: 'localhost:3030' },
      qsSyncServer && { ws: qsSyncServer },
    ],
  });

  return repo;
}
