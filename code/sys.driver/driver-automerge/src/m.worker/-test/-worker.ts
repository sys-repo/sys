import { Crdt } from '../../-exports/-fs/mod.ts';
import { CrdtWorker } from '../mod.ts';

/**
 * Single-repo worker host.
 * - Creates one real repo instance.
 * - Listens for 'crdt:attach' and wires the provided MessagePort to that repo.
 * - No manual 'stream/open' ack; CrdtWorker.attach emits lifecycle events already.
 */
const repo = Crdt.repo({ dir: '.tmp/-worker' });
CrdtWorker.listen(self, repo);
