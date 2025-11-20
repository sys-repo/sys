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
  CrdtWorker,
  createPeerId,
  D,
  Is,
  toObject,
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
  kind: 'crdt:web',
  repo(args = {}) {
    const { sharePolicy, denylist, until } = args;
    const store = wrangle.storage(args);
    const storage = store?.adapter;
    const stores = store?.info ? [store.info] : [];
    const network = wrangle.network(args);
    const peerId = createPeerId();
    const base = new AutomergeRepo({ storage, network, sharePolicy, denylist, peerId });
    return toRepo(base, { peerId, stores, until });
  },
  Is: CrdtIs,
  Url: CrdtUrl,
  Worker: CrdtWorker,
  whenReady,
  toObject,
};

/**
 * Helpers:
 */
type TStore = { adapter: t.StorageAdapterInterface; info: t.CrdtRepoStoreInfoIdb };
const wrangle = {
  indexedDb(options: { database?: string } = {}) {
    const { database = D.database } = options;
    const store = D.store;
    const info: t.CrdtRepoStoreInfoIdb = { kind: 'indexed-db', database, store };
    const adapter = new IndexedDBStorageAdapter(database, store);
    return { adapter, info } as const;
  },

  storage(args?: Args): TStore | undefined {
    if (!args?.storage) return;
    const done = (
      adapter: t.StorageAdapterInterface,
      maybeInfo?: t.CrdtRepoStoreInfoIdb,
    ): TStore => {
      return {
        adapter,
        info: maybeInfo ?? { kind: 'indexed-db', database: '<unknown>', store: '<unknown>' },
      };
    };

    const arg = args?.storage;
    if (arg === 'IndexedDb' || arg === true) {
      const db = wrangle.indexedDb();
      return done(db.adapter, db.info);
    }
    if (arg instanceof IndexedDBStorageAdapter) {
      return done(arg);
    }
    if (Is.record(arg) && Is.string(arg.database)) {
      const db = wrangle.indexedDb(arg);
      return done(db.adapter, db.info);
    }
    return;
  },

  network(args?: Args): t.NetworkAdapterInterface[] {
    if (!args?.network) return [];
    const adapters = Arr.asArray(args.network)
      .filter(Boolean)
      .map(wrangle.adapter)
      .filter(Boolean) as t.NetworkAdapterInterface[];
    return adapters;
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
