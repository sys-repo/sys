import { type t, slug } from '../common.ts';
import { CrdtWorker } from '../mod.ts';
import { getRepoPort } from '../u.client.proxy.repo.ts';

/**
 * Create an isolated CRDT worker fixture for tests.
 *
 * @example
 * ```ts
 * describe('test suite', () => {
 *   let env: t.TestWorkerFixture;
 *   beforeAll(async () => void (env = await makeWorkerFixture()));
 *   afterAll(() => env?.dispose());
 * });
 * ```
 */
export async function makeWorkerFixture(opts: { silent?: boolean; storage?: boolean } = {}) {
  const { silent = true, storage = true } = opts;

  const url = new URL('./u.fixture.worker.ts', import.meta.url);
  const config: t.CrdtWorkerSpawnConfigFs = {
    kind: 'fs',
    storage: storage ? `.tmp/test/worker-fixture/${slug()}` : undefined,
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
