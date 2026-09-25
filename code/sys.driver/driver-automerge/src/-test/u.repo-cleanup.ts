import type { Repo as AutomergeRepo } from '@automerge/automerge-repo';
import { type t, Time } from './common.ts';

type AfterAll = (fn: () => void | Promise<void>) => void;

/** Register only the fixed Automerge throttle-tail drain for suites that own their cleanup inline. */
export function repoTailDrain(afterAll: AfterAll) {
  afterAll(drainRepoTail);
}

/** Track test repos, close them at suite teardown, then drain Automerge's fixed throttle tail. */
export function repoCleanup(afterAll: AfterAll) {
  const automerge = new Set<AutomergeRepo>();
  const crdt = new Set<t.CrdtRepo>();

  afterAll(async () => {
    await Promise.all([...crdt].map((repo) => repo.dispose()));
    await Promise.all([...automerge].map((repo) => repo.shutdown()));
    crdt.clear();
    automerge.clear();

    await drainRepoTail();
  });

  return {
    automerge<T extends AutomergeRepo>(repo: T): T {
      automerge.add(repo);
      return repo;
    },
    crdt<T extends t.CrdtRepo>(repo: T): T {
      crdt.add(repo);
      return repo;
    },
  } as const;
}

async function drainRepoTail() {
  // @automerge/automerge-repo@2.5.6 has non-cancellable 100ms throttle timers.
  await Time.wait(110);
}
