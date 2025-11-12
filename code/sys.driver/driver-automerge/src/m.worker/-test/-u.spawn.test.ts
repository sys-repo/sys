import { c, describe, expect, it, Schedule } from '../../-test.ts';
import { CrdtWorker } from '../mod.ts';

describe('CrdtWorker.spawn (smoke test)', () => {
  it('creates a worker-backed repo and reaches ready state', async () => {
    const url = new URL('./-sample.worker.ts', import.meta.url);
    const { worker, repo } = await CrdtWorker.spawn(url, { worker: { type: 'module' } });

    await repo.whenReady();
    await Schedule.micro();

    console.info();
    console.info(c.cyan(`repo (client shim):`));
    console.info(repo);
    console.info();

    expect(repo.ready).to.eql(true);

    // Cleanup:
    await repo.dispose(); // close client facade and subscriptions
    await Schedule.macro(); // let disposals flush
    worker.terminate(); // stop the worker
    await Schedule.macro(); // one more tick to settle
  });
});
