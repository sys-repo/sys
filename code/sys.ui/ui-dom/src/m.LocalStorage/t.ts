import type { t } from '../common.ts';

/**
 * Helpers for working with a strongly typed local-storage object.
 */
export declare namespace LocalStorage {
  /** Helpers for working with a strongly typed local-storage object. */
  export type Lib = {
    /**
     * Generates a new strongly typed wrapper around the browser's local-storage.
     * @param prefix - the namespace prepended to keys written to underlying local-storage.
     */
    ns<T extends t.JsonMapLikeU>(prefix: string): Namespace<T>;

    /** Returns an Immutable<T> representation of the local-storage. */
    immutable<T extends t.JsonMapLikeU>(key: string, initial: T): Immutable<T>;
  };

  /** An Immutable<T> interface over local-storage. */
  export type Immutable<T extends t.JsonMapLikeU> = t.ImmutableRef<
    T,
    t.Rfc6902PatchOperation,
    t.ImmutableEvents<T, t.Rfc6902PatchOperation, t.ImmutableChange<T, t.Rfc6902PatchOperation>>
  > & {
    /** Clears the local-storage entry and resets to the default values passed in at creation. */
    reset(initial?: T): void;
  };

  /** A strongly typed wrapper around the browser's local-storage. */
  export type Namespace<T extends t.JsonMapLikeU> = {
    /** A prefix for keys in the local-storage. */
    readonly namespace: string;

    /** Retrieves a value from local-storage by key, or returns a default value if not present. */
    get<K extends keyof T>(key: K, defaultValue: T[K]): T[K];

    /** Stores a value in the local-storage for the specified key. */
    put<K extends keyof T>(key: K, value: T[K]): T[K];

    /** Deletes an entry from the local-storage by key. */
    delete<K extends keyof T>(key: K): void;

    /** Clears all entries from the local-storage. */
    clear(): void;

    /** Returns an object representing the initial values in local-storage. */
    object(initial: T): T;
  };
}
