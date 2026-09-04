import type { t } from './common.ts';

/**
 * Simple JSON based file-persistence with an ImmutableRef<T> handle API.
 */
export declare namespace JsonFile {
  /** JsonFile helper library. */
  export type Lib = {
    /** Common defaults. */
    default(): Doc;
    default<T extends Doc>(seed: Seed<T>): T;

    /** Get JsonFile handle for the given path (pure, non-cached). */
    readonly get: Get;

    /** Singleton pool, keyed by resolved path. */
    readonly Singleton: Singleton.Lib;
  };

  /** Immutable representation of a persistable JSON file. */
  export type Instance<T extends Doc = Doc> = t.ImmutableRef<T> & {
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

  /** Minimal document shape stored in a JsonFile. */
  export type Doc = { '.meta': Meta };

  /** JsonFile document metadata. */
  export type Meta = {
    createdAt: t.UnixTimestamp;
    modifiedAt?: t.UnixTimestamp;
  };

  /** Seed input for a JsonFile document. */
  export type Seed<T extends Doc> = Omit<T, '.meta'> & {
    readonly '.meta'?: Partial<Meta>;
  };

  /** Options controlling how a JsonFile is initialised. */
  export type GetOptions = {
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
  export type Get = <D extends Doc>(
    path: t.StringPath,
    initial: D,
    options?: GetOptions,
  ) => Promise<Instance<D>>;

  /**
   * Singleton pool API for JsonFile handles.
   */
  export namespace Singleton {
    /** Singleton pool API for JsonFile handles. */
    export type Lib = {
      readonly get: Get;

      /** Resolved file paths currently in the singleton pool. */
      readonly keys: () => readonly t.StringPath[];

      /** Snapshot of the singleton pool as [path, JsonFile] tuples. */
      readonly entries: () => readonly (readonly [t.StringPath, Instance<Doc>])[];

      /** Clear all singleton instances (intended for tests / teardown). */
      readonly clear: () => void;
    };

    /**
     * Singleton `get` API for JsonFile handles.
     *
     * - If an instance already exists for the resolved path, it is returned.
     * - If no instance exists and `initial` is provided, a new handle is created,
     *   cached, and returned.
     * - If no instance exists and `initial` is omitted, an error is thrown
     *   (runtime contract).
     *
     * The `options` parameter mirrors {@link JsonFile.Get}, e.g. `touch`.
     */
    export type Get = <T extends Doc = Doc>(
      path: t.StringPath,
      initial?: T | (() => T),
      options?: GetOptions,
    ) => Promise<Instance<T>>;
  }
}
