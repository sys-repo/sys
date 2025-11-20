import { type t, afterEach, c, describe, expect, it } from '../../-test.ts';
import { CrdtWorker } from '../mod.ts';
import { createTestHelpers } from './u.ts';

describe('CrdtWorker.spawn (real worker)', () => {
  const Test = createTestHelpers();
  afterEach(Test.reset);

  const url = new URL('./u.worker.ts', import.meta.url);

  /**
   * ---------------------------------------------------------------------------
   * 1. Spawn basics
   * ---------------------------------------------------------------------------
   */
  it('creates a worker-backed repo and reaches ready state', async () => {
    const { worker, repo } = await CrdtWorker.spawn(url, { worker: { type: 'module' } });

    expect(repo.status.ready).to.eql(false);
    await repo.whenReady();
    expect(repo.status.ready).to.eql(true);

    console.info();
    console.info(c.cyan(`repo (client proxy):`));
    console.info(repo);
    console.info();

    // Cleanup:
    worker.terminate();
    await repo.dispose();
  });

  it('accepts an existing Worker instance and wires the same worker', async () => {
    const worker = new Worker(url, { type: 'module' });

    const result = await CrdtWorker.spawn(worker);
    const { repo } = result;

    // The spawn helper should use the same worker instance.
    expect(result.worker).to.equal(worker);

    expect(repo.status.ready).to.eql(false);
    await repo.whenReady();
    expect(repo.status.ready).to.eql(true);

    // Cleanup:
    worker.terminate();
    await repo.dispose();
  });

  /**
   * ---------------------------------------------------------------------------
   * 2. Spawn config propagation
   * ---------------------------------------------------------------------------
   *
   * This verifies: spawn(..., { config }) → delivered to worker (echoed by test worker).
   */
  describe('spawn config', () => {
    it('passes CrdtWorkerSpawnConfig through spawn to the worker', async () => {
      const worker = new Worker(url, { type: 'module' });

      const config: t.CrdtWorkerSpawnConfig = {
        kind: 'fs',
        storage: '.tmp/-worker-config',
        network: [],
      };

      // Wait for worker to echo { kind: 'config', config } before calling spawn.
      const receivedConfig = new Promise<t.CrdtWorkerSpawnConfig>((resolve) => {
        const onMessage = (ev: MessageEvent) => {
          const data = ev.data as { kind?: string; config?: t.CrdtWorkerSpawnConfig } | undefined;
          if (data?.kind === 'config' && data.config) {
            worker.removeEventListener('message', onMessage);
            resolve(data.config);
          }
        };
        worker.addEventListener('message', onMessage);
      });

      const { repo } = await CrdtWorker.spawn(worker, { config });
      expect(await receivedConfig).to.eql(config);

      // Cleanup:
      worker.terminate();
      await repo.dispose();
    });
  });

  /**
   * ---------------------------------------------------------------------------
   * 3. Spawn/listen handshake (fake worker boundary test)
   * ---------------------------------------------------------------------------
   *
   * This uses Test.fakeWorkerLikeScope(real) to simulate worker boundary
   * without real Worker threads.
   */
  describe('spawn/listen handshake', () => {
    it('wires repo events over a spawned worker-style boundary', async () => {
      const real = Test.realRepo();
      const fakeWorker = Test.fakeWorkerLikeScope(real);

      const { port1, port2 } = new MessageChannel();
      fakeWorker.postMessage({ kind: 'crdt:attach', port: port2 }, [port2]);

      const client = CrdtWorker.repo(port1);
      expect(client.status.ready).to.eql(false);

      await client.whenReady();
      expect(client.status.ready).to.eql(true);
      expect(client.sync.enabled).to.eql(real.sync.enabled);

      // Cleanup:
      fakeWorker.terminate();
      await client.dispose();
      await real.dispose();
    });
  });
});
