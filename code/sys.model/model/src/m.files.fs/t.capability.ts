import type { t } from '../common.ts';

/**
 * Structural host-filesystem capabilities consumed by the files/fs adapter.
 */
export declare namespace FilesFsCapability {
  /** Structural readonly filesystem capability compatible with the files/fs adapter. */
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

  /** Structural filesystem capability with live watch support. */
  export type Live = Readonly & {
    /** Watch backing paths for filesystem changes. */
    readonly watch: Watch;
  };

  /** Start a backing filesystem watcher. */
  export type Watch = (path: t.StringPath, options?: WatchOptions) => t.Awaitable<Watcher>;

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

  /** Path operations required by the files/fs adapter. */
  export type Path = {
    readonly Is: PathIs;
    readonly join: (...parts: readonly string[]) => t.StringPath;
    readonly resolve: (...parts: readonly string[]) => t.StringAbsolutePath;
    readonly relative: (from: t.StringPath, to: t.StringPath) => t.StringRelativePath;
    readonly normalize: (path: t.StringPath) => t.StringPath;
  };

  /** Path predicates required by the files/fs adapter. */
  export type PathIs = {
    readonly absolute: (path: t.StringPath) => boolean;
  };

  /** Minimal stat shape consumed by the files/fs adapter. */
  export type Stat = {
    readonly kind?: t.FilesEntry.Kind;
    readonly isFile?: boolean;
    readonly isDirectory?: boolean;
    readonly isSymlink?: boolean;
    readonly size?: t.NumberBytes;
    readonly modifiedAt?: t.UnixTimestamp;
    readonly hash?: t.StringHash;
    readonly mediaType?: t.StringMimeType;
  };

  /** Minimal walk entry shape consumed by the files/fs adapter. */
  export type WalkEntry = {
    readonly path: t.StringPath;
    readonly kind?: t.FilesEntry.Kind;
    readonly isFile?: boolean;
    readonly isDirectory?: boolean;
    readonly stat?: Stat;
  };
}
