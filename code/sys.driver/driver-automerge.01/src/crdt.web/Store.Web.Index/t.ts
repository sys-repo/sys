import type { t } from './common.ts';

/**
 * A CRDT that represents an index of a store/repo.
 */
export type WebStoreIndex = t.StoreIndex & {
  readonly db: t.StoreIndexDb;
};
