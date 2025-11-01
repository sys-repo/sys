import { Repo as AutomergeRepo } from '@automerge/automerge-repo';
import { toRepo } from '../mod.ts';

/**
 * Fixtures:
 */
export function testRepo() {
  return toRepo(new AutomergeRepo());
}
