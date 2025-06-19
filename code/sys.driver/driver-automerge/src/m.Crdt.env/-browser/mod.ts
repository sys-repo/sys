/**
 * @module
 * CRDTs that work in a browser environment.
 */
import { Repo } from '@automerge/automerge-repo';
import { BroadcastChannelNetworkAdapter } from '@automerge/automerge-repo-network-broadcastchannel';
import {
  BrowserWebSocketClientAdapter,
  WebSocketClientAdapter,
} from '@automerge/automerge-repo-network-websocket';
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';
import { type t, Arr, CrdtIs, CrdtUrl, D, Is, slug, toRepo } from './common.ts';

type Args = t.CrdtBrowserRepoArgs;

/**
 * Exports:
 */
export { toAutomergeHandle, toAutomergeRepo } from './common.ts';

/**
 * Library:
 */
export const Crdt: t.CrdtBrowserLib = {
  kind: 'Crdt:Browser',
  repo(args = {}) {
    const { sharePolicy, denylist } = args;
    const storage = wrangle.storage(args);
    const network = wrangle.network(args);
    const peerId = `peer.${slug()}` as t.PeerId;
    const base = new Repo({ storage, network, sharePolicy, denylist, peerId });
    return toRepo(base, { peerId });
  },
  Is: CrdtIs,
  Url: CrdtUrl,
};

/**
 * Helpers:
 */
const wrangle = {
  indexedDb(options: { database?: string } = {}) {
    const { database = D.database } = options;
    return new IndexedDBStorageAdapter(database);
  },

  storage(args?: Args): t.StorageAdapterInterface | undefined {
    if (!args?.storage) return;
    const arg = args?.storage;
    if (arg === 'IndexedDb' || arg === true) return wrangle.indexedDb();
    if (arg instanceof IndexedDBStorageAdapter) return arg;
    if (Is.record(arg) && Is.string(arg.database)) return wrangle.indexedDb(arg);
    return;
  },

  network(args?: Args): t.NetworkAdapterInterface[] | undefined {
    if (!args?.network) return;
    return Arr.asArray(args.network)
      .map(wrangle.adapter)
      .filter(Boolean) as t.NetworkAdapterInterface[];
  },

  adapter(arg?: t.CrdtBrowserNetworkArg) {
    if (arg === 'BroadcastChannel') return new BroadcastChannelNetworkAdapter();
    if (Is.record(arg) && Is.string(arg.ws)) return wrangle.ws(arg.ws);
    return arg as t.NetworkAdapterInterface;
  },

  ws(text: string): WebSocketClientAdapter {
    const url = Crdt.Url.ws(text);
    return new BrowserWebSocketClientAdapter(url);
  },
} as const;
