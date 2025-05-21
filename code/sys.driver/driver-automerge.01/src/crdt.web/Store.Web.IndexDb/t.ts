import type { t } from './common.ts';

/**
 * IndexedDB
 * NOTE: Extends the automerge-repo database.
 */
export type StoreIndexDb = t.Lifecycle & {
  name: string;
  database: IDBDatabase;
  exists(store: t.WebStore): Promise<boolean>;
  get(store: t.WebStore): Promise<t.StoreMetaRecord | undefined>;
  getOrCreate(store: t.WebStore): Promise<t.StoreMetaRecord>;
  delete(store: t.WebStore): Promise<{ existed: boolean }>;
};

/**
 * DB Record: maps to where an index
 */
export type StoreMetaRecord = {
  dbname: string; // Name of the IndexedDB used by the repos [StorageAdapter].
  index: string; //  URI of index-document for the store/repo.
};
