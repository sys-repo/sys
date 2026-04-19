/**
 * @module
 * Safe: CRDT repository setup for web/workers.
 * No UI modules leak into this boundary.
 */
import { Crdt } from '../-exports/-web.ui/mod.ts';
export { Log } from '@sys/std/log';
import { Url } from '@sys/std/url';
import { TestConfig } from '../-test.repo.ts';

export { Crdt, TestConfig };

/**
 * Create "dev" CRDT repository instance:
 */
export function createUiRepo(opts: { silent?: boolean } = {}) {
  const { silent } = opts;
  const { storage, network } = TestConfig.web({ silent });
  const repo = Crdt.repo({ storage, network });
  return repo;
}

/**
 * Spawns a test UI repo on a background web worker.
 */
export async function spawnUiRepoWorker(opts: { silent?: boolean } = {}) {
  const { silent } = opts;
  const config = TestConfig.web({ silent });

  // NB: URL must declared be within Worker constructor for vite to bundle it correctly.
  const w = new Worker(new URL('./-test.ui.repo.worker.ts', import.meta.url), { type: 'module' });
  const { repo } = await Crdt.Worker.Client.spawn(w, { config });

  return repo;
}
