import { Repo } from '@automerge/automerge-repo';
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';
import { BroadcastChannel, Doc, Store } from '../common.ts';
import { WebStoreIndex as Index } from '../Store.Web.Index/mod.ts';
import { StoreIndexDb } from '../Store.Web.IndexDb/mod.ts';
import { DEFAULTS, Delete, Is, Symbols, type t } from './common.ts';

type Init = {
  network?: boolean | t.NetworkAdapterInterface[];
  storage?: boolean | string | { name?: string };
  dispose$?: t.UntilObservable;
  debug?: t.StoreDebug;
};

/**
 * Manage an Automerge "repo" on the browser.
 */
export const WebStore = {
  Doc,

  get IndexDb() {
    return StoreIndexDb;
  },

  /**
   * Create instance of the store/repo's document Index.
   */
  Index,
  index: Index.init,

  /**
   * Initialize a new instance of a CRDT store/repo.
   */
  init(options: Init = {}) {
    const { debug, dispose$ } = options;
    const network = Wrangle.network(options);
    const storage = Wrangle.storage(options);
    const repo = new Repo({ network, storage });

    const base = Store.init({ repo, debug, dispose$ });
    const store: t.WebStore = {
      ...base,
      get disposed() {
        return base.disposed;
      },

      /**
       * Metadata about the store.
       */
      get info() {
        return Wrangle.info(options);
      },
    };

    (store as any)[Symbols.kind] = Symbols.WebStore;
    return store;
  },
} as const;

/**
 * Helpers
 */
const Wrangle = {
  network(options: Init): t.NetworkAdapterInterface[] {
    const { network } = options;
    if (network === undefined || network === true) return [BroadcastChannel.create()];
    return Array.isArray(network) ? network : [];
  },

  networkKinds(options: Init) {
    const { network } = options;
    const kinds: t.StoreNetworkKind[] = [];
    if (network === undefined || network === true) kinds.push('BroadcastChannel');
    if (Array.isArray(network)) {
      network.forEach((item) => {
        if (Is.broadcastChannel(item)) kinds.push('BroadcastChannel');
      });
    }
    return kinds;
  },

  storage(options: Init) {
    const { storage } = options;
    const defaultName = DEFAULTS.storage.name;
    const done = (name?: string | null) => {
      return name ? new IndexedDBStorageAdapter(name) : undefined;
    };
    if (storage === false) return done(null);
    if (storage === undefined || storage === true) return done(defaultName);
    if (typeof storage === 'string') return done(storage);
    if (typeof storage === 'object') return done(storage.name || defaultName);
    return done();
  },

  storageName(options: Init) {
    const { storage } = options;
    const defaultName = DEFAULTS.storage.name;
    if (storage === false) return undefined;
    if (storage === undefined || storage === true) return defaultName;
    if (typeof storage === 'string') return storage;
    if (typeof storage === 'object') return storage.name || defaultName;
    return '';
  },

  info(options: Init): t.WebStoreInfo {
    const storage = Wrangle.storageName(options);
    const network = Wrangle.networkKinds(options);
    return Delete.undefined({
      storage: storage ? { kind: 'IndexedDb', name: storage } : undefined,
      network: network.length > 0 ? { kinds: network } : undefined,
    });
  },
} as const;
