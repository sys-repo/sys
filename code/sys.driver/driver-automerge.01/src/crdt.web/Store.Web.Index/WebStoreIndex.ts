import { Store } from '../common.ts';
import { StoreIndexDb } from '../Store.Web.IndexDb/mod.ts';
import { Is, type t } from './common.ts';

export const WebStoreIndex = {
  Doc: Store.Doc,
  Filter: Store.Index.Filter,

  /**
   * Create instance of the store/repo's document Index.
   */
  async init(store: t.Store): Promise<t.WebStoreIndex> {
    if (!Is.webStore(store)) throw new Error('[Store] is not a [WebStore]');

    const dbname = StoreIndexDb.name(store);
    const db = await StoreIndexDb.init(dbname);
    const record = await db.getOrCreate(store);
    const uri = record.index;
    const base = await Store.Index.init(store, { uri });
    return {
      ...base,
      total() {
        return base.total();
      },
      db,
    };
  },
} as const;
