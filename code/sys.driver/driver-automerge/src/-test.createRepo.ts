/**
 * @module
 * Safe: CRDT repository setup for web/workers.
 * No UI modules leak into this boundary.
 */
import { Url } from '@sys/std';
import { Crdt } from '@sys/driver-automerge/web';
import { type t, slug } from './common.ts';

export { Log, Url } from '@sys/std';
export { Crdt };

/**
 * Raw repo configurations (serializable):
 */
export const TestConfig = {
  /**
   * File-system unit-tests.
   */
  fs(opts: { uniq?: boolean; silent?: boolean } = {}): t.CrdtWorkerSpawnConfigFs {
    const { uniq = true, silent } = opts;
    return {
      kind: 'fs',
      storage: `.tmp/test/-worker.repo/${uniq ? slug() : '-main'}`,
      network: [],
      silent,
    };
  },
};

/**
 * Create "dev" CRDT repository instance:
 */
export function createRepo() {
  if (!location) throw new Error('UI test repo only');

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
