import { Crdt, Url } from '../common.ts';

/**
 * crdt: @sys/driver-automerge
 */
export function createRepo() {
  const qsSyncServer = Url.parse(location.href).toURL().searchParams.get('ws');
  const isLocalhost = location.hostname === 'localhost';

  const repo = Crdt.repo({
    storage: { database: 'dev:slc.crdt' },
    network: [
      //
      { ws: 'sync.db.team' },
      { ws: 'waiheke.sync.db.team' },
      isLocalhost && { ws: 'localhost:3030' },
      qsSyncServer && { ws: qsSyncServer },
    ],
  });

  return repo;
}
