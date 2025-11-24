import { Crdt } from '../../-exports/-fs/mod.ts';
import { type t } from '../common.ts';

Crdt.Worker.Host.listen(self, (e) => {
  const config: t.CrdtWorkerConfig = e.config ?? {
    kind: 'fs',
    storage: '.tmp/-worker-factory',
    network: [],
  };

  if (config.kind !== 'fs') throw new Error(`Unsupported config.kind: ${config.kind}`);

  // Optional: prove config actually arrived.
  self.postMessage({ kind: 'test/config/factory', config });

  return Crdt.repo({
    dir: config.storage,
    network: config.network ?? [],
  });
});
