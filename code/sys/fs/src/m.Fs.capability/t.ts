import type { t } from './common.ts';

/** Portable filesystem and path capability contracts. */
export namespace FsCapability {
  /** Adapter API for building portable filesystem capabilities. */
  export type Lib = {
    /** Build a portable capability instance from the full `@sys/fs` library. */
    readonly fromFs: (fs: t.Fs.Lib) => Instance;

    /** Files capability adapters. */
    readonly Files: Files.Lib;

    /** Publish, seal, coordinate, and remove owned trees beneath one canonical root. */
    readonly Rooted: t.FsRooted.Lib;
  };

  /** Capability adapters for the `Files` data model. */
  export namespace Files {
    /** Adapters grouped by readonly, writable, and live authority. */
    export type Lib = {
      /** Readonly Files capability adapters. */
      readonly Readonly: ReadonlyLib;

      /** Writable Files capability adapters. */
      readonly Writable: WritableLib;
    };

    /** Readonly Files adapter namespace. */
    export type ReadonlyLib = {
      /** Adapt `@sys/fs` into a structural readonly Files backing capability. */
      readonly create: (fs: t.Fs.Lib) => Readonly;

      /** Adapt `@sys/fs` into a structural readonly+live Files backing capability. */
      readonly live: (fs: t.Fs.Lib) => Live;
    };

    /** Writable Files adapter namespace. */
    export type WritableLib = {
      /** Adapt `@sys/fs` into a structural writable Files backing capability. */
      readonly create: (fs: t.Fs.Lib) => Writable;

      /** Adapt `@sys/fs` into a structural writable+live Files backing capability. */
      readonly live: (fs: t.Fs.Lib) => LiveWritable;
    };

    /** Structural readonly filesystem capability compatible with `@sys/model/files/fs`. */
    export type Readonly = {
      /** Path namespace operations with the same semantics as the backing. */
      readonly Path: Path;

      /** Resolve real/canonical path, following symlinks. */
      readonly realPath: (path: t.StringPath) => t.Awaitable<t.StringAbsolutePath | undefined>;

      /** Stat a backing path. */
      readonly stat: (path: t.StringPath) => t.Awaitable<Stat | undefined>;

      /** Read UTF-8 text content from a backing path. */
      readonly readText: (path: t.StringPath) => t.Awaitable<string | undefined>;

      /** Walk entries under a backing directory. */
      readonly walk: (
        path: t.StringPath,
      ) => t.Awaitable<Iterable<WalkEntry> | AsyncIterable<WalkEntry>>;
    };

    /** Structural writable filesystem capability compatible with `@sys/model/files/fs`. */
    export type Writable = Readonly & {
      /** Stat a backing path without following the final symlink. */
      readonly lstat: (path: t.StringPath) => t.Awaitable<Stat | undefined>;

      /** Ensure a backing directory exists. */
      readonly ensureDir: (path: t.StringPath) => t.Awaitable<void>;

      /** Atomically replace a complete file value at the target path. */
      readonly writeFileAtomic: (
        path: t.StringPath,
        content: Uint8Array,
        options?: WriteFileOptions,
      ) => t.Awaitable<void>;

      /** Remove one backing file or empty directory. Recursive deletion is model-owned. */
      readonly removeEntry: (path: t.StringPath) => t.Awaitable<void>;
    };

    /** Structural live filesystem capability compatible with `@sys/model/files/fs`. */
    export type Live = Readonly & {
      /** Watch backing paths for filesystem changes. */
      readonly watch: Watch;
    };

    /** Structural writable live filesystem capability compatible with `@sys/model/files/fs`. */
    export type LiveWritable = Writable & Live;

    /** Start a backing filesystem watcher. */
    export type Watch = (path: t.StringPath, options?: WatchOptions) => t.Awaitable<Watcher>;

    /** Options passed to the structural atomic write capability. */
    export type WriteFileOptions = {
      readonly mediaType?: t.StringMimeType;
    };

    /** Options passed to the structural watch capability. */
    export type WatchOptions = {
      readonly recursive?: boolean;
    };

    /** Live backing filesystem watcher. */
    export type Watcher = t.DisposableLike & {
      readonly $: WatchObservable;
      readonly paths: readonly t.StringPath[];
      readonly exists: boolean;
      readonly error?: t.StdError;
    };

    /** Minimal observable shape consumed by the model adapter. */
    export type WatchObservable = {
      readonly subscribe: (next: (event: WatchEvent) => void) => WatchSubscription;
    };

    /** Minimal subscription shape consumed by the model adapter. */
    export type WatchSubscription = {
      readonly unsubscribe: () => void;
    };

    /** Minimal filesystem watch event shape consumed by the model adapter. */
    export type WatchEvent = {
      readonly kind: WatchEventKind;
      readonly paths: readonly t.StringPath[];
    };

    /** Filesystem watch event kinds understood by the model adapter. */
    export type WatchEventKind = 'any' | 'access' | 'create' | 'modify' | 'remove' | 'other';

    /** Path operations required by the readonly Files capability. */
    export type Path = {
      readonly Is: PathIs;
      readonly join: (...parts: readonly string[]) => t.StringPath;
      readonly resolve: (...parts: readonly string[]) => t.StringAbsolutePath;
      readonly relative: (from: t.StringPath, to: t.StringPath) => t.StringRelativePath;
      readonly normalize: (path: t.StringPath) => t.StringPath;
    };

    /** Path predicates required by the readonly Files capability. */
    export type PathIs = {
      readonly absolute: (path: t.StringPath) => boolean;
    };

    /** Minimal stat shape produced by the readonly Files capability. */
    export type Stat = {
      readonly isFile?: boolean;
      readonly isDirectory?: boolean;
      readonly isSymlink?: boolean;
      readonly size?: t.NumberBytes;
    };

    /** Minimal walk entry shape produced by the readonly Files capability. */
    export type WalkEntry = {
      readonly path: t.StringPath;
      readonly isFile?: boolean;
      readonly isDirectory?: boolean;
    };
  }

  /**
   * Portable filesystem/path runtime capability.
   *
   * Consumers should rely on a minimal stable subset of `stat` fields.
   * Avoid platform-specific file metadata unless explicitly required and tested.
   */
  export type Instance = {
    readonly read: t.Fs.Lib['read'];
    readonly exists: t.Fs.Lib['exists'];
    readonly copy: t.Fs.Lib['copy'];
    readonly write: t.Fs.Lib['write'];
    readonly ensureDir: t.Fs.Lib['ensureDir'];
    readonly stat: t.Fs.Lib['stat'];
    readonly dirname: t.Fs.Lib['dirname'];
    readonly join: t.Fs.Lib['join'];
    readonly cwd: t.Fs.Lib['cwd'];
    readonly resolve: t.Fs.Lib['resolve'];
    readonly walk: t.Fs.Lib['walk'];
    readonly remove: t.Fs.Lib['remove'];
  };
}
