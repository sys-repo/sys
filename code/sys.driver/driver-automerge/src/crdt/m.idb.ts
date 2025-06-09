import { Repo } from '@automerge/automerge-repo';
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';

import { type t } from './common.ts';
import { CrdtIs as Is } from './m.Is.ts';
import { toRepo } from './u.toRepo.ts';

export const Crdt: t.CrdtLibIdb = {
  Is,
  kind: 'IndexedDb',
  async repo(args = {}) {
    const { sharePolicy, denylist } = args;
    const network = wrangle.network(args);
    const storage = new IndexedDBStorageAdapter();

    const base = new Repo({ storage, network, sharePolicy, denylist });
    return toRepo(base);
  },
};

/**
 * Helpers:
 */
const wrangle = {
  network(args?: t.CrdtIdbRepoArgs): t.NetworkAdapterInterface[] | undefined {
    if (!args?.network) return;
    return Array.isArray(args.network) ? args.network : [args.network];
  },
} as const;
