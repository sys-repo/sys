import { Repo } from '@automerge/automerge-repo';
import { BroadcastChannelNetworkAdapter } from '@automerge/automerge-repo-network-broadcastchannel';
import { WebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';
import { type t, Arr, CrdtIs, Is, toRepo } from './common.ts';

export const Crdt: t.CrdtBrowserLib = {
  kind: 'Crdt:Browser',
  Is: CrdtIs,
  repo(args = {}) {
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
    return Arr.asArray(args.network)
      .map((arg) => {
        if (arg === 'BroadcastChannel') return new BroadcastChannelNetworkAdapter();
        if (Is.record(arg) && Is.string(arg.wss)) return wrangle.wss(arg.wss);
        return arg;
      })
      .filter(Boolean) as t.NetworkAdapterInterface[];
  },

  wss(text: string): WebSocketClientAdapter {
    const host = text.trim().replace(/^wss\:\/\//, '');
    return new WebSocketClientAdapter(`wss://${host}`);
  },
} as const;
