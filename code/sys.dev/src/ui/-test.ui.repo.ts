/**
 * @module
 * Safe: CRDT repository setup for web/workers.
 * No UI modules leak into this boundary.
 */
import { Crdt } from '@sys/driver-automerge/web';
import { Url } from '@sys/std';

export { Url } from '@sys/std/url';
export { Log } from '@sys/std';
export { Crdt };

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

/**
 * Spawns a test UI repo on a background web worker.
 */
export async function spawnUiRepoWorker() {
  const w = new Worker(new URL('./-test.ui.repo.worker.ts', import.meta.url), { type: 'module' });
  const { repo } = await Crdt.Worker.Client.spawn(w);
  return { repo };
}
