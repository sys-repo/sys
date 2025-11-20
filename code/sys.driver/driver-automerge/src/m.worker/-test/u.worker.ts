import { Crdt } from '../../-exports/-fs/mod.ts';

/**
 * Echo: for spawn with config test.
 */
self.addEventListener('message', (ev) => {
  const data = ev.data as { kind?: string; config?: unknown } | undefined;
  if (data?.kind === 'crdt:attach' && data.config !== undefined) {
    self.postMessage({ kind: 'config', config: data.config });
  }
});

/**
 * Single-repo worker host.
 */
const repo = Crdt.repo({ dir: '.tmp/-worker' });
await repo.whenReady();
Crdt.Worker.listen(self, repo);
