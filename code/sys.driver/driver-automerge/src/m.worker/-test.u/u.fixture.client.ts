import { type t, slug } from '../common.ts';
import { CrdtWorker } from '../mod.ts';
import { getRepoPort } from '../u.client.proxy.repo.ts';

/**
 * Create an isolated CRDT worker fixture for tests.
 *
 * - Spawns a worker using `u.fixture.worker.ts` and attaches a repo.
 * - Uses a unique `.tmp/test/worker-fixture/<slug>` storage path per call.
 * - Returns both the repo facade and low-level worker/port handles.
 */
export async function makeWorkerFixture(opts: { silent?: boolean } = {}) {
  const { silent = true } = opts;
  const url = new URL('./u.fixture.worker.ts', import.meta.url);

  const config: t.CrdtWorkerSpawnConfigFs = {
    kind: 'fs',
    storage: `.tmp/test/worker-fixture/${slug()}`,
    network: [],
    silent,
  };

  const { worker, repo } = await CrdtWorker.Client.spawn(url, { config });
  const port = getRepoPort(repo as t.CrdtRepoWorkerProxy);

  const fixture: t.TestWorkerFixture = {
    repo,
    worker: { url, instance: worker },
    config,
    port,
    async dispose() {
      await repo.dispose();
      worker.terminate();
    },
  };

  return fixture;
}
