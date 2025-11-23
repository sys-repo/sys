import { Crdt, createRepo, Log } from '../../../../-test.repo.ts';

const log = Log.logger('repo:worker', { timestamp: null });
const repo = createRepo();

log(`Crdt.Worker.Host.listen: "${repo.id.instance}"`);
repo.events().$.subscribe((e) => log('⚡️', e));

/**
 * Start the CRDT worker message pump.
 */
Crdt.Worker.Host.listen(self, repo);
