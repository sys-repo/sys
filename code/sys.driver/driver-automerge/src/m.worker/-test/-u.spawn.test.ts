import { c, describe, expect, it } from '../../-test.ts';
import { CrdtWorker } from '../mod.ts';

describe('CrdtWorker.spawn (smoke test, real worker)', () => {
  it('creates a worker-backed repo and reaches ready state', async () => {
    const url = new URL('./-worker.ts', import.meta.url);
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
});
