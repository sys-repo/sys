import { Crdt } from '../../-exports/-fs/mod.ts';
import type { t } from '../common.ts';

/**
 * Echo: for `Worker.spawn` with config test.
 */
Crdt.Worker.onConfig<t.CrdtWorkerSpawnConfigFs>((e) => {
  /**
   * In normal usage (not tests) - setup the repo here.
   */
  self.postMessage({ kind: 'test/config', config: e });
});

/**
 * Single-repo worker host.
 */
const repo = Crdt.repo({ dir: '.tmp/-worker' });
await repo.whenReady();
Crdt.Worker.listen(self, repo);
