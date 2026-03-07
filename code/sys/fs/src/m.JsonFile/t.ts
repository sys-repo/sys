import type { t } from './common.ts';

type D = t.JsonFileDoc;

export type JsonFileSeed<T extends JsonFileDoc> = Omit<T, '.meta'> & {
  readonly '.meta'?: Partial<JsonFileMeta>;
};

/**
 * Simple JSON based file-persistence with an ImmutableRef<T> handle API.
 */
export type JsonFileLib = {
  /** Common defaults */
  default(): JsonFileDoc;
  default<T extends JsonFileDoc>(seed: JsonFileSeed<T>): T;

  /** Get JsonFile handle for the given path (pure, non-cached). */
  readonly get: JsonFileGet;

  /** Singleton pool, keyed by resolved path. */
  readonly Singleton: JsonFileSingletonLib;
};

/**
 * Options controlling how a JsonFile is initialised.
 */
export type JsonFileGetOptions = {
  /**
   * If true, ensure the file exists on disk when first created.
   *
   * - If the file already exists, this flag is a no-op.
   * - If the file does not exist yet, the initial document is
   *   materialised to disk.
   *
   * Default: false (lazy write – only `save()` persists changes).
   */
  readonly touch?: boolean;
};

/**
 * Get a JsonFile handle for the given path.
 *
 * - If the file does not exist, `initial` is used as the in-memory seed.
 * - If the file exists, the JSON is loaded from disk and used as the seed.
 * - In both cases, `.meta.createdAt` is ensured to be set on the seed document.
 *
 * The returned handle is an `ImmutableRef<T>` extended with an `fs` helper
 * for file-system operations.
 */
export type JsonFileGet = <D extends t.JsonFileDoc>(
  path: t.StringPath,
  initial: D,
  options?: JsonFileGetOptions,
) => Promise<t.JsonFile<D>>;

/**
 * Singleton `get` API for JsonFile handles.
 *
 * - If an instance already exists for the resolved path, it is returned.
 * - If no instance exists and `initial` is provided, a new handle is created,
 *   cached, and returned.
 * - If no instance exists and `initial` is omitted, an error is thrown
 *   (runtime contract).
 *
 * The `options` parameter mirrors {@link JsonFileGet}, e.g. `touch`.
 */
export type JsonFileSingletonGet = <T extends JsonFileDoc = JsonFileDoc>(
  path: t.StringPath,
  initial?: T | (() => T),
  options?: JsonFileGetOptions,
) => Promise<t.JsonFile<T>>;

/**
 * Singleton pool API for JsonFile handles.
 */
export type JsonFileSingletonLib = {
  readonly get: JsonFileSingletonGet;

  /** Resolved file paths currently in the singleton pool. */
  readonly keys: () => readonly t.StringPath[];

  /** Snapshot of the singleton pool as [path, JsonFile] tuples. */
  readonly entries: () => readonly (readonly [t.StringPath, t.JsonFile<JsonFileDoc>])[];

  /** Clear all singleton instances (intended for tests / teardown). */
  readonly clear: () => void;
};

/**
 * Immutable representation of a persistable JSON file.
 */
export type JsonFile<T extends D = D> = t.ImmutableRef<T> & {
  /** File-system API for the file. */
  readonly fs: {
    readonly path: t.StringPath;

    /**
     * True when the in-memory document has diverged from the last
     * successfully persisted snapshot (i.e. there are unsaved changes).
     */
    readonly pending: boolean;

    /**
     * Persist the current document to disk.
     *
     * - On success, `pending` may be cleared (if no additional changes
     *   occurred during the save).
     * - On error, the attempt to update `.meta.modifiedAt` is reverted.
     */
    save(): Promise<{ error?: t.StdError }>;
  };
};

export type JsonFileDoc = { '.meta': JsonFileMeta };
export type JsonFileMeta = {
  createdAt: t.UnixTimestamp;
  modifiedAt?: t.UnixTimestamp;
};
