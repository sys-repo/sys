import { Crdt, createUiRepo, Log } from './-test.ui.repo.ts';

const log = Log.logger('repo:worker', { timestamp: null });
const repo = createUiRepo();

log(repo);
log(`Crdt.Worker.Host.listen: "${repo.id.instance}"`);
repo.events().$.subscribe((e) => log('⚡️', e));

/**
 * Start the CRDT worker message pump.
 */
Crdt.Worker.Host.listen(self, repo);
