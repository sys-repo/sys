import type { t } from './common.ts';

type D = t.JsonFileDoc;

/**
 * Simple JSON based file-persistence with an ImmutableRef<T> handle API.
 */
export type JsonFileLib = {
  /** Common defaults */
  default(): JsonFileDoc;

  /** Get JsonFile handle for the given path (pure, non-cached). */
  readonly get: JsonFileGet;

  /** Singleton pool, keyed by resolved path. */
  readonly Singleton: JsonFileSingletonLib;
};

/**
 * Singleton pool API for JsonFile handles.
 */
export type JsonFileSingletonLib = {
  /**
   * Get a shared JsonFile handle for the given path.
   *
   * - If an instance already exists for the resolved path, it is returned.
   * - If no instance exists and `initial` is provided, a new handle is created,
   *   cached, and returned.
   * - If no instance exists and `initial` is omitted, an error is thrown
   *   (runtime contract).
   */
  readonly get: <T extends JsonFileDoc = JsonFileDoc>(
    path: t.StringPath,
    initial?: T | (() => T),
  ) => Promise<t.JsonFile<T>>;

  /** Resolved file paths currently in the singleton pool. */
  readonly keys: () => readonly t.StringPath[];

  /** Snapshot of the singleton pool as [path, JsonFile] tuples. */
  readonly entries: () => readonly (readonly [t.StringPath, t.JsonFile<JsonFileDoc>])[];

  /** Clear all singleton instances (intended for tests / teardown). */
  readonly clear: () => void;
};

/**
 * Get a JsonFile handle for the given path.
 *
 * - If the file does not exist, it is created on disk using `initial`.
 * - If the file exists, the JSON is loaded from disk and used as the seed.
 * - In both cases, `.meta.createdAt` is ensured to be set on the seed document.
 *
 * The returned handle is an `ImmutableRef<T>` extended with an `fs` helper
 * for file-system operations (currently `{ path, save() }`).
 */
export type JsonFileGet = <D extends t.JsonFileDoc>(
  path: t.StringPath,
  initial: D,
) => Promise<t.JsonFile<D>>;

/**
 * Immutable representation of a persistable JSON file.
 */
export type JsonFile<T extends D = D> = t.ImmutableRef<T> & {
  /** File-system API for the file. */
  readonly fs: {
    readonly path: t.StringPath;
    readonly savePending: boolean;
    save(): Promise<{ error?: t.StdError }>;
  };
};

export type JsonFileDoc = { '.meta': JsonFileMeta };
export type JsonFileMeta = {
  createdAt: t.UnixTimestamp;
  modifiedAt?: t.UnixTimestamp;
};
