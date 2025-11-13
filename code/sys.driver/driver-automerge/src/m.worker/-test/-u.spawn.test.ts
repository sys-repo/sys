import { afterEach, c, describe, expect, it } from '../../-test.ts';
import { Schedule } from '../common.ts';
import { CrdtWorker } from '../mod.ts';
import { createTestHelpers } from './u.ts';

describe('CrdtWorker.spawn (smoke test, real worker)', () => {
  const Test = createTestHelpers();
  afterEach(Test.reset);

  it('creates a worker-backed repo and reaches ready state', async () => {
    const url = new URL('./worker.ts', import.meta.url);
    const { worker, repo } = await CrdtWorker.spawn(url, { worker: { type: 'module' } });

    expect(repo.ready).to.eql(false);
    await repo.whenReady();
    expect(repo.ready).to.eql(true);

    console.info();
    console.info(c.cyan(`repo (client shim):`));
    console.info(repo);
    console.info();

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
      expect(client.ready).to.eql(false);

      await client.whenReady();
      expect(client.ready).to.eql(true);
      expect(client.sync.enabled).to.eql(real.sync.enabled);

      // Cleanup:
      fakeWorker.terminate();
      await client.dispose();
      await real.dispose();
    });
  });
});
