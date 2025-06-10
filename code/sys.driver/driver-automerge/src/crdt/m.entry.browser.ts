import { Repo } from '@automerge/automerge-repo';
import { BroadcastChannelNetworkAdapter } from '@automerge/automerge-repo-network-broadcastchannel';
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';

import { type t, Arr } from './common.ts';
import { CrdtIs as Is } from './m.Is.ts';
import { toRepo } from './u.toRepo.ts';

export const Crdt: t.CrdtBrowserLib = {
  Is,
  kind: 'Browser',
  async repo(args = {}) {
    const { sharePolicy, denylist } = args;
    const network = wrangle.network(args);
    const storage = wrangle.storage(args);
    const base = new Repo({ storage, network, sharePolicy, denylist });
    return toRepo(base);
  },
};

/**
 * Helpers:
 */
const wrangle = {
  storage(args?: t.CrdtBrowserRepoArgs): t.StorageAdapterInterface | undefined {
    if (!args?.storage) return;
    if (args.storage === 'IndexedDb') return new IndexedDBStorageAdapter();
    return args.storage;
  },

  network(args?: t.CrdtBrowserRepoArgs): t.NetworkAdapterInterface[] | undefined {
    if (!args?.network) return;
    return Arr.asArray(args.network).map((arg) => {
      if (arg === 'BroadcastChannel') return new BroadcastChannelNetworkAdapter();
      return arg;
    });
  },
} as const;
