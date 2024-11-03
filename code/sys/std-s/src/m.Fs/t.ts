import type { FormatOptions } from '@std/fmt/bytes';
import type * as StdFs from '@std/fs';
import type * as StdPath from '@std/path';

import type { WalkEntry } from '@std/fs';
import type { t } from './common.ts';

export type { WalkEntry };

/**
 * Tools for working with the file-system.
 */
export type FsLib = StdMethods & {
  /** Helpers for working with resource paths. */
  readonly Path: t.FsPathLib;

  /** Filesystem/Path type verification flags. */
  readonly Is: t.FsIsLib;

  /** Tools for calculating file sizes. */
  readonly Size: t.FsSizeLib;

  /** Tools for watching file-system changes. */
  readonly Watch: t.FsWatchLib;

  /** Retrieve information about the given path. */
  readonly stat: t.FsGetStat;

  /** Factory for a glob helper. */
  readonly glob: t.GlobFactory;

  /** Copy a file or directory. */
  readonly copy: t.FsCopy;

  /** Copy all files in a directory. */
  readonly copyDir: t.FsCopyDir;

  /** Copy a single file. */
  readonly copyFile: t.FsCopyFile;

  /** Remove a file or directory if it exists. */
  readonly remove: t.FsRemove;

  /** Asynchronously reads and returns the entire contents of a file as strongly-type JSON. */
  readonly readJson: t.FsReadJson;

  /** Recursively walk up a directory tree (visitor pattern). */
  readonly walkUp: t.FsWalkUp;

  /** Start a file-system watcher */
  readonly watch: t.FsWatchLib['start'];
};

/** Methods from the `@std` libs. */
type StdMethods = {
  /** Joins a sequence of paths, then normalizes the resulting path. */
  readonly join: typeof StdPath.join;

  /** Resolves path segments into a path. */
  readonly resolve: typeof StdPath.resolve;

  /** Return the directory path of a path. */
  readonly dirname: typeof StdPath.dirname;

  /** Return the last portion of a path. */
  readonly basename: typeof StdPath.basename;

  /** Asynchronously test whether or not the given path exists by checking with the file system. */
  readonly exists: typeof StdFs.exists;

  /** Asynchronously ensures that the directory exists, like `mkdir -p.` */
  readonly ensureDir: typeof StdFs.ensureDir;

  /** Recursively walks through a directory and yields information about each file and directory encountered. */
  readonly walk: typeof StdFs.walk;
};

/**
 * Filesystem/Path type verification flags.
 */
export type FsIsLib = t.PathLib['Is'] & {
  /** Determine if the given path points to a directory. */
  dir(path: t.StringPath | URL): Promise<boolean>;
};

/**
 * Library: helpers for working with resource paths with the existence of the server FS tools.
 */
export type FsPathLib = t.PathLib & {
  /** Convert the path to it's parent directory if it is not already a directory target. */
  asDir(path: t.StringPath): Promise<string>;
};

/**
 * Generate a Glob helper scoped to a path.
 */
export type GlobFactory = (...dir: (t.StringPath | undefined)[]) => t.Glob;

/**
 * Runs globs against a filesystem root.
 */
export type Glob = {
  /**
   * Read out the base directory.
   */
  readonly base: string;

  /**
   *  Query the given glob pattern.
   */
  find(pattern: string, options?: { exclude?: string[] }): Promise<WalkEntry[]>;

  /**
   * Retrieve a sub-directory [Glob] from the current context.
   */
  dir(...subdir: (string | undefined)[]): Glob;
};

/**
 * Retrieve information about the given path.
 */
export type FsGetStat = (path: t.StringPath | URL) => Promise<Deno.FileInfo>;

/**
 * Copy a file or directory.
 */
export type FsCopy = (
  from: t.StringPath,
  to: t.StringPath,
  options?: t.FsCopyOptions,
) => Promise<t.FsCopyResponse>;

/** Copy all files in a directory. */
export type FsCopyDir = t.FsCopy;

/** Copy an individual file. */
export type FsCopyFile = t.FsCopy;

/** Options passed to a file-system copy operation */
export type FsCopyOptions = {
  /** Write errors and other meta-information to the console: default: false */
  log?: boolean;
  /** Overwrite existing directory files, default: false */
  force?: boolean;
};

/** Response to an file-system copy operation. */
export type FsCopyResponse = { error?: t.StdError };

/**
 * Delete a file or directory (and it's contents).
 */
export type FsRemove = (
  path: string,
  options?: { dryRun?: boolean; log?: boolean },
) => Promise<boolean>;

/**
 * Asynchronously reads and returns the entire contents of a file as strongly-type JSON.
 */
export type FsReadJson = <T>(path: t.StringPath) => Promise<FsReadJsonResponse<T>>;
export type FsReadJsonResponse<T> = {
  readonly ok: boolean;
  readonly exists: boolean;
  readonly path: string;
  readonly json?: T;
  readonly error?: Error;
  readonly errorReason?: 'NotFound' | 'ParseError' | 'Unknown';
};

/**
 * Recursively walk up a directory tree (visitor pattern).
 */
export type FsWalkUp = (startAt: t.StringPath, onVisit: t.FsWalkUpallback) => Promise<void>;
export type FsWalkUpallback = (e: FsWalkUpCallbackArgs) => FsWalkUpallbackResponse;
export type FsWalkUpallbackResponse = Promise<t.IgnoredResponse> | t.IgnoredResponse;
export type FsWalkUpCallbackArgs = {
  dir: t.StringDir;
  files(): Promise<FsWalkFile[]>;
  stop(): void;
};

/**
 * Details about a walked file.
 */
export type FsWalkFile = {
  path: t.StringPath;
  dir: t.StringDir;
  name: string;
  isSymlink: boolean;
};

/**
 * Tools for calculating file sizes.
 */
export type FsSizeLib = {
  /**
   * Walk a directory and total up the file sizes.
   */
  dir(path: t.StringDir, options?: { maxDepth?: number }): Promise<FsDirSize>;
};

/**
 * Represents the byte-size of all files within a directory.
 */
export type FsDirSize = {
  readonly exists: boolean;
  readonly path: t.StringDir;
  readonly total: { files: number; bytes: number };
  toString(options?: FormatOptions): string;
};

/**
 * Tools for watching file-system changes.
 */
export type FsWatchLib = {
  start(
    paths: t.StringPath | t.StringPath[],
    options?: { recursive?: boolean; dispose$?: t.UntilObservable },
  ): Promise<t.FsWatcher>;
};

/**
 * A live file-system watcher.
 */
export type FsWatcher = t.Lifecycle & {
  readonly $: t.Observable<t.FsWatchEvent>;

  /** The paths being wathced. */
  readonly paths: t.StringPath[];

  /** Flag indicating if all the watched paths exist. */
  readonly exists: boolean;

  /** Flags */
  readonly is: { readonly recursive?: boolean };

  /** Error(s) that may have occured during setup or while watching. */
  readonly error?: t.StdError;
};

/** An event fired by a watched file-system location. */
export type FsWatchEvent = Deno.FsEvent;
