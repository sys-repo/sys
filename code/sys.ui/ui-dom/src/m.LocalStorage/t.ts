import type { t } from '../common.ts';

/**
 * Helpers for working with a strongly typed local-storage object.
 */
export type LocalStorageLib = {
  /**
   * Generates a new `LocalStorage<T>` strongly typed wrapper
   * around the browser's local-storage.
   * @param {string} prefix - the namespace prepended to the keys written to underlying local-storage.
   */
  ns<T extends t.JsonMapU>(prefix: string): LocalStorage<T>;

  /** Returns an Immutable<T> representation of the local-storage. */
  immutable<T extends t.JsonMapU>(
    key: string,
    initial: T,
    dispose$?: t.UntilInput,
  ): t.LocalStorageImmutable<T>;
};

/**
 * An Immutable<T> interface over local-storage.
 */
export type LocalStorageImmutable<T> = t.ImmutableRef<
  T,
  t.PatchOperation,
  t.ImmutableEvents<T, t.PatchOperation, t.ImmutableChange<T, t.PatchOperation>>
>;

/**
 * A strongly typed wrapper around the browser's local-storage.
 */
export type LocalStorage<T extends t.JsonMapU> = {
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
