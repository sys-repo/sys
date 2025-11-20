import { Crdt } from '../../-exports/-fs/mod.ts';
import type { t } from '../common.ts';

/**
 * Single-repo worker host.
 */
const repo = Crdt.repo({ dir: '.tmp/-worker' });
await repo.whenReady();
Crdt.Worker.listen(self, repo);
