import type { t } from '../../common.ts';

/**
 * Structural host-filesystem capabilities consumed by the files/fs adapter.
 *
 * Read/query operations report absence or inaccessibility as `undefined`/empty results rather than
 * throwing host-path-bearing errors. Mutation operations may throw; the adapter converts those
 * failures into Files-scoped errors before exposing them through Cmd handlers.
 */

/** Structural readonly filesystem capability compatible with the files/fs adapter. */
export type Readonly = {
  /** Path namespace operations with the same semantics as the backing. */
  readonly Path: Path;

  /** Resolve real/canonical path, following symlinks. Returns `undefined` for absence/failure. */
  readonly realPath: (path: t.StringPath) => t.Awaitable<t.StringAbsolutePath | undefined>;

  /** Stat a backing path. Returns `undefined` for absence/failure. */
  readonly stat: (path: t.StringPath) => t.Awaitable<Stat | undefined>;

  /** Read UTF-8 text content from a backing path. Returns `undefined` for absence/failure. */
  readonly readText: (path: t.StringPath) => t.Awaitable<string | undefined>;

  /** Walk entries under a backing directory. Returns an empty walk for absence/failure. */
  readonly walk: (
    path: t.StringPath,
  ) => t.Awaitable<Iterable<WalkEntry> | AsyncIterable<WalkEntry>>;
};

/**
 * Structural writable filesystem capability compatible with the files/fs adapter.
 *
 * Implementations must not widen the bounded Files authority: all paths received here are
 * already model-bounded lexically, but implementations still own host-level race safety and
 * must not follow symlinks in ways that escape the intended target operation.
 */
export type Writable = Readonly & {
  /** Stat a backing path without following the final symlink. Returns `undefined` for absence. */
  readonly lstat: (path: t.StringPath) => t.Awaitable<Stat | undefined>;

  /**
   * Ensure a backing directory exists. The implementation must not create directories outside
   * the intended bounded root if the host filesystem changes concurrently.
   */
  readonly ensureDir: (path: t.StringPath) => t.Awaitable<void>;

  /**
   * Atomically replace a complete file value at the target path.
   *
   * The target path must be replaced as one complete value, never exposed as a partial/truncated
   * write. Any scratch/temp artifacts used to achieve atomicity must remain invisible to Files
   * list/stat/read/watch projection and must not become durable user-visible entries on success.
   */
  readonly writeFileAtomic: (
    path: t.StringPath,
    content: Uint8Array,
    options?: WriteFileOptions,
  ) => t.Awaitable<void>;

  /** Remove one backing file or empty directory. Recursive deletion is model-owned. */
  readonly removeEntry: (path: t.StringPath) => t.Awaitable<void>;
};

/** Structural filesystem capability with live watch support. */
export type Live = Readonly & {
  /** Watch backing paths for filesystem changes. */
  readonly watch: Watch;
};

/** Structural writable filesystem capability with live watch support. */
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
  readonly kind?: t.Files.Entry.Kind;
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
  readonly kind?: t.Files.Entry.Kind;
  readonly isFile?: boolean;
  readonly isDirectory?: boolean;
  readonly stat?: Stat;
};
