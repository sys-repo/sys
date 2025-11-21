import { Crdt, TestConfig } from '../-test.createRepo.ts';
import { type t, Rx } from '../common.ts';

/**
 * Spawn a CRDT repo inside a worker for unit tests.
 */
export async function spawnTestWorker(opts: { silent?: boolean } = {}): Promise<t.TestWorkerEnv> {
  const { silent = true } = opts;
  const url = new URL('./u.fs.worker.ts', import.meta.url);

  /**
   * Spawn repo on worker.
   */
  const config = TestConfig.fs({ silent });
  const { repo, worker } = await Crdt.Worker.Client.spawn(url, { config });

  /**
   * Wait for ready.
   */
  const evt = repo.events();
  const ready$ = evt.ready$.pipe(Rx.take(1));
  await Rx.firstValueFrom(ready$);
  evt.dispose();

  /**
   * API:
   */
  return {
    repo,
    worker,
    async dispose() {
      await repo?.dispose();
      worker?.terminate();
    },
  };
}
