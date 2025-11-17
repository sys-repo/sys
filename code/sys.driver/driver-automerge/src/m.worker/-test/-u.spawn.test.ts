import { afterEach, c, describe, expect, it } from '../../-test.ts';
import { CrdtWorker } from '../mod.ts';
import { createTestHelpers } from './u.ts';

describe('CrdtWorker.spawn (smoke test, real worker)', () => {
  const Test = createTestHelpers();
  afterEach(Test.reset);

  it('creates a worker-backed repo and reaches ready state', async () => {
    const url = new URL('./worker.ts', import.meta.url);
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

  it('accepts a Worker instance and wires the same worker', async () => {
    const url = new URL('./worker.ts', import.meta.url);
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

  describe('CrdtWorker.spawn/listen handshake', () => {
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
