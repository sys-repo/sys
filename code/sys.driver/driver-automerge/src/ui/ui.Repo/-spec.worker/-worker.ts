import { Log } from '@sys/std';
import { createRepo } from '../../-test.ui.createRepo.ts';
import { Crdt } from '@sys/driver-automerge/web';

const log = Log.logger('worker', { timestamp: null });
const repo = createRepo();

log('repo', repo);
log(`Crdt.Worker.listen: "${repo.id.instance}"`);
repo.events().$.subscribe((e) => log(e));

/**
 * Start the CRDT worker message pump.
 */
Crdt.Worker.listen(self, repo);
