import { Log } from '@sys/std';
import { createRepo } from '../../-test.ui.createRepo.ts';
import { Crdt } from '@sys/driver-automerge/web';

const repo = createRepo();

const log = Log.logger('worker', { timestamp: null });
log('repo', repo);
log(`Crdt.Worker.listen: "${repo.id.instance}"`);

/**
 * Start the CRDT worker message pump.
 */
Crdt.Worker.listen(self, repo);
