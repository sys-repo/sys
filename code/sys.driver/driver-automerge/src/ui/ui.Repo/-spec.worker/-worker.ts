import { Crdt } from '../../../-exports/-web/mod.ts'; // NB: pure non-UI (non-react) boundary.

const repo = Crdt.repo({});
console.info(`[worker] Crdt.Worker.listen: "${repo.id.instance}"`);

/**
 * Start the CRDT worker message pump.
 */
Crdt.Worker.listen(self, repo);
