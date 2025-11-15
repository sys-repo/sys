import { Crdt } from '../../../-exports/-web/mod.ts';
import { createRepo } from '../../-test.ui.createRepo.ts';

const repo = createRepo();

console.log('[worker] repo', repo);
console.info(`[worker] Crdt.Worker.listen: "${repo.id.instance}"`);

/**
 * Start the CRDT worker message pump.
 */
Crdt.Worker.listen(self, repo);
