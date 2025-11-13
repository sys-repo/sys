import { Crdt } from '../../-exports/-fs/mod.ts';
import { CrdtWorker } from '../mod.ts';

/**
 * Single-repo worker host.
 */
const repo = Crdt.repo({ dir: '.tmp/-worker' });
CrdtWorker.listen(self, repo);
