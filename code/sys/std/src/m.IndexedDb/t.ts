import type { t } from '../common.ts';

/** Response object returned from the IndexedDb delete operation. */
export type IndexedDbDeleteResponse = { name: string; error?: string };

/**
 * IndexedDB helper contracts.
 */
export declare namespace IndexedDb {
  /** Promise based wrapper into the IndexedDB API. */
  export type Lib = {
    /** Helpers for working IndexedDb record objects. */
    readonly Record: Record.Lib;

    /** Helpers looking at the IDBDatabase container itself. */
    readonly Database: Database.Lib;

    /**
     * Create a promised base interface into an IndexedDb.
     */
    init<T>(args: {
      name: string;
      version?: number;
      schema?: (req: IDBOpenDBRequest, e: IDBVersionChangeEvent) => void;
      store: (db: IDBDatabase) => T;
    }): Promise<T>;

    /**
     * Delete the named database.
     */
    delete(name: string): Promise<t.IndexedDbDeleteResponse>;

    /**
     * Convert a IDBRequest to a <Typed> promise.
     */
    asPromise<T>(req: IDBRequest<any>): Promise<T>;
  };

  /**
   * Helpers for working IndexedDb record objects.
   */
  export namespace Record {
    /** IndexedDB record helper library surface. */
    export type Lib = {
      /** Retrieves the value of the first record matching the given key or key range in query. */
      get<T>(
        store: IDBObjectStore | IDBIndex,
        query: IDBValidKey | IDBKeyRange,
      ): Promise<T | undefined>;

      /** Retrieves all records matching the given key or key range in query. */
      getAll<T>(store: IDBObjectStore | IDBIndex, query?: IDBValidKey | IDBKeyRange): Promise<T[]>;

      /** Add or update an object in the given store. */
      put<T>(store: IDBObjectStore, value: T, key?: IDBValidKey): Promise<T>;

      /** Delete an object. */
      delete<T>(store: IDBObjectStore, key: IDBValidKey | IDBKeyRange): Promise<T>;
    };
  }

  /**
   * Helpers looking at the IDBDatabase container itself.
   */
  export namespace Database {
    /** IndexedDB database helper library surface. */
    export type Lib = {
      /** Determine if an IDBDatabase is closed. */
      isClosed(db: IDBDatabase): boolean;
    };
  }
}
