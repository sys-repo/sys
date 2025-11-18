import { Crdt, createRepo, Log } from './-test.createRepo.ts';

const log = Log.logger('repo:worker', { timestamp: null });
const repo = createRepo();

log(repo);
log(`Crdt.Worker.listen: "${repo.id.instance}"`);
repo.events().$.subscribe((e) => log('⚡️', e));

/**
 * Start the CRDT worker message pump.
 */
Crdt.Worker.listen(self, repo);
