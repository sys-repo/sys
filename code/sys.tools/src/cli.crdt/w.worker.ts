import { Log, Crdt, D, Path } from './common.ts';

const log = Log.logger('worker');
const url = new URL(import.meta.url);
const dir = Path.join(url.searchParams.get('dir') ?? '', D.Path.repo);
const ws = D.Sync.server;

log('Repo:');
log(`- dir: ${dir}`);
log(`- network: ${ws}`);

/**
 * Single-repo worker host.
 */
const repo = Crdt.repo({
  dir,
  network: [{ ws }],
});

await repo.whenReady();
Crdt.Worker.listen(self, repo);
