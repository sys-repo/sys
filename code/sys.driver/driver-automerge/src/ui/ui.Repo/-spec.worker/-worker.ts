import { createRepo } from '../../-test.ui.ts';
import { Crdt } from '../common.ts';

/**
 * Single-repo worker host.
 */
const repo = createRepo();
Crdt.Worker.listen(self, repo);
