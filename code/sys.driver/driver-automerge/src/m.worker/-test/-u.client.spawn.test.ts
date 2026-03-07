import { type t, afterEach, c, describe, expect, it } from '../../-test.ts';
import { CrdtWorker } from '../mod.ts';
import { createTestHelpers } from './u.ts';
import { CrdtCmd } from '../common.ts';

describe('CrdtWorker.Client.spawn (real worker)', () => {
  const Test = createTestHelpers();
  afterEach(Test.reset);

  const url = new URL('./u.worker.ts', import.meta.url);

  /**
   * ---------------------------------------------------------------------------
   * 1. Spawn basics
   * ---------------------------------------------------------------------------
   */
  it('creates a worker-backed repo and reaches ready state', async () => {
    const { worker, repo } = await CrdtWorker.Client.spawn(url, { worker: { type: 'module' } });

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

    const result = await CrdtWorker.Client.spawn(worker);
    const { repo } = result;

    // The spawn helper should use the same worker instance.
    expect(result.worker).to.equal(worker);

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
  describe('listen(factory) with spawn config', () => {
    const url = new URL('./u.worker.listen.ts', import.meta.url);

    it('creates repo via factory and receives config in worker', async () => {
      const worker = new Worker(url, { type: 'module' });
      const config: t.CrdtWorkerConfig = {
        kind: 'fs',
        storage: '.tmp/-worker-factory-config',
        network: [],
      };

      const receivedConfig = new Promise<t.CrdtWorkerConfig>((resolve) => {
        const onMessage = (ev: MessageEvent) => {
          const data = ev.data as { kind?: string; config?: t.CrdtWorkerConfig } | undefined;
          if (data?.kind === 'test/config/factory' && data.config) {
            worker.removeEventListener('message', onMessage);
            resolve(data.config);
          }
        };
        worker.addEventListener('message', onMessage);
      });

      const { repo } = await CrdtWorker.Client.spawn(worker, { config });
      await repo.whenReady();

      expect(repo.status.ready).to.eql(true);
      expect(await receivedConfig).to.eql(config);

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

      // 1. Tell the fake worker to install its listen() handler and bind to `port2`.
      fakeWorker.postMessage({ kind: 'crdt:attach', port: port2 }, [port2]);

      // 2. Create the client-side repo facade on `port1` so it can receive events.
      const client = CrdtWorker.Client.repo(port1);
      expect(client.status.ready).to.eql(false);

      // 3. Drive the new typed command handshake: `attach` over the same port.
      const cmd = CrdtCmd.make();
      const cmdClient = cmd.client(port1);
      await cmdClient.send('attach', { config: undefined });

      // 4. Now the host has called attachRepo(...), so the client should reach ready.
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
