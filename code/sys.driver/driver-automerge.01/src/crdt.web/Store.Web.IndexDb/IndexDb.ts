import { IndexedDb, NAME, rx, type t } from './common.ts';

/**
 * An IndexedDB for storing meta-data about [Store/Repo]'s.
 */
export const StoreIndexDb = {
  /**
   * Format the index DB name.
   */
  name(store: string | t.WebStore) {
    let root = (typeof store === 'string' ? store : store.info.storage?.name || '').trim();
    if (!root) throw new Error(`A store name is required for the Index`);
    root = root.replace(/\:*$/, '');
    return `${root}:sys`;
  },

  /**
   * Initialie a new entry-point to the DB containing references to Store/Repo indexes.
   */
  init(name: string) {
    const { Record } = IndexedDb;
    return IndexedDb.init<t.StoreIndexDb>({
      name,
      version: 1,

      /**
       * Database schema declaration.
       */
      schema(req, _e) {
        type R = t.StoreMetaRecord;
        const db = req.result;
        const dbname: keyof R = 'dbname';
        const index: keyof R = 'index';
        const store = db.createObjectStore(NAME.STORE.repos, { keyPath: dbname });
        store.createIndex(NAME.INDEX.repos.dbname_index, [dbname, index], { unique: true });
      },

      /**
       * Database operations.
       */
      store(db) {
        const life = rx.lifecycle();
        const { dispose, dispose$ } = life;
        dispose$.subscribe(() => db.close());

        const api: t.StoreIndexDb = {
          name,
          database: db,

          /**
           * Determine if an DB "index" entry exists for the given store.
           */
          async exists(store) {
            return Boolean(await api.get(store));
          },

          get(store: t.WebStore) {
            const dbname = Wrangle.dbname(store);
            const tx = db.transaction([NAME.STORE.repos], 'readonly');
            const table = tx.objectStore(NAME.STORE.repos);
            return Record.get<t.StoreMetaRecord>(table, dbname);
          },

          /**
           * Add a new store=index reference to the DB.
           */
          async getOrCreate(store: t.WebStore) {
            const dbname = Wrangle.dbname(store);
            if (!dbname) {
              const err = `Cannot add "index" as the store/repo does not have storage enabled.`;
              throw new Error(err);
            }

            const existing = await api.get(store);
            if (existing) return existing;

            const doc = await store.doc.getOrCreate<t.StoreIndexDoc>((d) => (d.docs = []));
            const tx = db.transaction([NAME.STORE.repos], 'readwrite');
            const table = tx.objectStore(NAME.STORE.repos);
            const record: t.StoreMetaRecord = { dbname, index: doc.uri };
            await Record.put(table, record);
            return record;
          },

          async delete(store: t.WebStore) {
            const dbname = Wrangle.dbname(store);
            const existed = await api.exists(store);
            const tx = db.transaction([NAME.STORE.repos], 'readwrite');
            const table = tx.objectStore(NAME.STORE.repos);
            await Record.delete<t.StoreMetaRecord>(table, dbname);
            return { existed };
          },

          /**
           * Lifecycle.
           */
          dispose,
          dispose$,
          get disposed() {
            return life.disposed;
          },
        };

        return api;
      },
    });
  },
} as const;

/**
 * Helpers
 */
const Wrangle = {
  dbname(store: t.WebStore) {
    return store.info.storage?.name ?? '';
  },
} as const;
