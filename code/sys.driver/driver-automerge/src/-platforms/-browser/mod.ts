/**
 * CRDTs that work in a browser environment.
 * @module
 */
import {
  BrowserWebSocketClientAdapter,
  WebSocketClientAdapter,
} from '@automerge/automerge-repo-network-websocket';
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';
import {
  type t,
  Arr,
  AutomergeRepo,
  CrdtIs,
  CrdtUrl,
  createPeerId,
  D,
  Is,
  toRepo,
  whenReady,
} from './common.ts';

type Args = t.CrdtBrowserRepoArgs;

/**
 * Exports:
 */
export { A, AutomergeRepo, toAutomergeHandle, toAutomergeRepo } from './common.ts';

/**
 * Library:
 */
export const Crdt: t.CrdtBrowserLib = {
  kind: 'Crdt:Browser',
  repo(args = {}) {
    const { sharePolicy, denylist } = args;
    const storage = wrangle.storage(args);
    const network = wrangle.network(args);
    const peerId = createPeerId();
    const base = new AutomergeRepo({ storage, network, sharePolicy, denylist, peerId });
    return toRepo(base, { peerId });
  },
  Is: CrdtIs,
  Url: CrdtUrl,
  whenReady,
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

  network(args?: Args): t.NetworkAdapterInterface[] {
    if (!args?.network) return [];
    return Arr.asArray(args.network)
      .filter(Boolean)
      .map(wrangle.adapter)
      .filter(Boolean) as t.NetworkAdapterInterface[];
  },

  adapter(arg?: t.CrdtBrowserNetworkArgInput) {
    if (Is.record(arg) && Is.string(arg.ws)) return wrangle.ws(arg.ws);
    return arg as t.NetworkAdapterInterface;
  },

  ws(text: string): WebSocketClientAdapter {
    const url = Crdt.Url.ws(text);
    return new BrowserWebSocketClientAdapter(url);
  },
} as const;
