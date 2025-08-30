/**
 * Testing tools running in the browser/ui.
 * @module
 */
import { Crdt, Url } from './common.ts';

export { expect } from '@sys/std/testing';
export { Dev, Lorem, Spec } from '@sys/ui-react-devharness';
export * from '../common.ts';

/**
 * Create "dev" CRDT repository instance:
 */
export function createRepo() {
  /**
   * CRDT:
   */
  const qsSyncServer = Url.parse(location.href).toURL().searchParams.get('ws');
  const isLocalhost = location.hostname === 'localhost';
  const isDev = isLocalhost && location.port !== '8080';

  const repo = Crdt.repo({
    storage: { database: 'dev.crdt' },
    network: [
      { ws: 'waiheke.sync.db.team' },
      isDev && { ws: 'localhost:3030' },
      qsSyncServer && { ws: qsSyncServer },
    ],
  });

  return repo;
}
