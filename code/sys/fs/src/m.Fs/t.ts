import type * as StdFs from '@std/fs';
import type * as StdPath from '@std/path';

import type { WalkEntry } from '@std/fs';
import type { t } from './common.ts';

export type * from './t.Dir.ts';
export type * from './t.File.ts';
export type { WalkEntry };

type Methods = StdMethods & IndexMethods & GlobMethods;

/**
 * Tools for working with the file-system.
 */
export type FsLib = Methods & {
  /** Retrieve information about the given path. */
  readonly stat: t.FsGetStat;

  /** Writes a string or binary file ensuring it's parent directory exists. */
  readonly write: t.FsWriteFile;

  /** Writes a JSON serializable value to a string of JSON to a file. */
  readonly writeJson: t.FsWriteJson;

  /** Copy a file or directory. */
  readonly copy: t.FsCopy;

  /** Copy all files in a directory. */
  readonly copyDir: t.FsCopyDir;

  /** Copy a single file. */
  readonly copyFile: t.FsCopyFile;

  /** Remove a file or directory if it exists. */
  readonly remove: t.FsRemove;

  /** Asynchronously reads and returns the entire contents of a binary file (Uint8Array). */
  readonly read: t.FsReadBinary;

  /** Asynchronously reads and returns the entire contents of a text file. */
  readonly readText: t.FsReadText;

  /** Asynchronously reads and returns the entire contents of a file as strongly-typed, parsed JSON. */
  readonly readJson: t.FsReadJson;

  /** Asynchronously reads and returns the entire contents of a file as strongly-typed, parsed JSON. */
  readonly readYaml: t.FsReadYaml;

  /** Recursively walk up a directory tree (visitor pattern). */
  readonly walkUp: t.FsWalkUp;

  /** Start a file-system watcher. */
  readonly watch: t.FsWatchLib['start'];

  /** Current working directory. */
  cwd(kind?: 'init'): t.StringDir;

  /** Removes the CWD (current-working-directory) from the given path if it exists. */
  trimCwd: t.FsPathLib['trimCwd'];

  /** Generator function that produces `FsFile` data-structures. */
  toFile: t.FsFileFactory;

  /** Generator function that produces `FsDir` data-structures. */
  toDir: t.FsDirFactory;
};

/**
 * Index properties.
 */
type IndexMethods = {
  /** Helpers for working with resource paths. */
  readonly Path: t.FsPathLib;

  /** File-system/path type verification flags. */
  readonly Is: t.FsIsLib;

  /** Helpers for calculating file sizes. */
  readonly Size: t.FsSizeLib;

  /** Helpers for watching file-system changes. */
  readonly Watch: t.FsWatchLib;
};

type GlobMethods = {
  /** List the file-paths within a directory (simple glob). */
  readonly ls: t.GlobPathList;

  /** Factory for a glob helper. */
  readonly glob: t.GlobFactory;
};

/**
 * Methods from the `@std` libs.
 */
type StdMethods = {
  /** Joins a sequence of paths, then normalizes the resulting path. */
  readonly join: typeof StdPath.join;

  /** Resolves path segments into a path. */
  readonly resolve: typeof StdPath.resolve;

  /** Return the directory path of a path. */
  readonly dirname: typeof StdPath.dirname;

  /** Return the last portion of a path. */
  readonly basename: typeof StdPath.basename;

  /** Return the last portion of a path. */
  readonly extname: typeof StdPath.extname;

  /** Asynchronously test whether or not the given path exists by checking with the file system. */
  readonly exists: typeof StdFs.exists;

  /** Asynchronously ensures that the directory exists, like `mkdir -p.` */
  readonly ensureDir: typeof StdFs.ensureDir;

  /** Asynchronously ensures that the link exists, and points to a valid file. */
  readonly ensureSymlink: typeof StdFs.ensureSymlink;

  /** Recursively walks through a directory and yields information about each file and directory encountered. */
  readonly walk: typeof StdFs.walk;
};

/**
 * Filesystem/Path type verification flags.
 */
export type FsIsLib = t.PathLib['Is'] & {
  /** Determine if the given path points to a directory. */
  dir(path: t.StringPath | URL): Promise<boolean>;

  /** Determine if the given path points to a file (not a directory). */
  file(path: t.StringPath | URL): Promise<boolean>;

  /** Determine if the given path points to a binary (non-string) file. */
  binary(path: t.StringPath | URL): Promise<boolean>;
};

/**
 * Retrieve information about the given path.
 */
export type FsGetStat = (path: t.StringPath | URL) => Promise<FsFileInfo | undefined>;
export type FsFileInfo = Deno.FileInfo;

/**
 * Copy a file or directory.
 */
export type FsCopy = (
  from: t.StringPath,
  to: t.StringPath,
  options?: t.FsCopyOptions | t.FsCopyFilter,
) => Promise<t.FsCopyResult>;

/** Copy all files in a directory. */
export type FsCopyDir = t.FsCopy;

/** Copy an individual file. */
export type FsCopyFile = t.FsCopy;

/** Options passed to a file-system copy operation, */
export type FsCopyOptions = {
  /** Write errors and other meta-information to the console (default: false). */
  log?: boolean;
  /** Overwrite existing directory files (default: false). */
  force?: boolean;
  /** Flag indicating if errors should be thrown (default: false). */
  throw?: boolean;
  /** Filter to remove files from the copy set. */
  filter?: t.FsCopyFilter;
};

/** Response from the `Fs.copy` method. */
export type FsCopyResult = { error?: t.StdError };

/**
 * Delete a file or directory (and it's contents).
 */
export type FsRemove = (
  path: string,
  options?: { dryRun?: boolean; log?: boolean },
) => Promise<boolean>;

/**
 * Writes a string or binary file ensuring it's parent directory exists.
 */
export type FsWriteFile = (
  path: t.StringPath,
  data: string | Uint8Array,
  options?: FsWriteFileOptions,
) => Promise<FsWriteFileResult>;

/** Options passed to the `Fs.write` method. */
export type FsWriteFileOptions = {
  /** Overwrite existing directory files (default: false). */
  force?: boolean;
  /** Flag indicating if errors should be thrown (default: false). */
  throw?: boolean;
};

/** Response from the `Fs.write` method. */
export type FsWriteFileResult = {
  readonly overwritten: boolean;
  readonly error?: t.StdError;
};

/**
 * Writes a JSON serializable value to a string of JSON to a file.
 */
export type FsWriteJson = (
  path: t.StringPath,
  data: t.Json,
  options?: t.FsWriteFileOptions,
) => Promise<FsWriteFileResult>;

/**
 * Asynchronously reads and returns the entire contents of a binary file (Uint8Array).
 */
export type FsReadBinary = (path: t.StringPath) => Promise<FsReadResult<Uint8Array>>;

/**
 * Asynchronously reads and returns the entire contents of a text file.
 */
export type FsReadText = (path: t.StringPath) => Promise<FsReadResult<string>>;

/**
 * Asynchronously reads and returns the entire contents of a file
 * as strongly-typed, parsed JSON.
 */
export type FsReadJson = <T>(path: t.StringPath) => Promise<FsReadResult<T>>;

/**
 * Asynchronously reads and returns the entire contents of a file
 * as strongly-typed, parsed YAML.
 */
export type FsReadYaml = <T>(path: t.StringPath) => Promise<FsReadResult<T>>;

/** A response from a file read operation.  */
export type FsReadResult<T> = {
  readonly ok: boolean;
  readonly exists: boolean;
  readonly path: string;
  readonly data?: T;
  readonly error?: t.StdError;
  readonly errorReason?: 'NotFound' | 'ParseError' | 'DecodingError' | 'Unknown';
};

/**
 * Recursively walk up a directory tree (visitor pattern).
 */
export type FsWalkUp = (startAt: t.StringPath, onVisit: t.FsWalkUpallback) => Promise<void>;
export type FsWalkUpallback = (e: FsWalkUpCallbackArgs) => FsWalkUpallbackResult;
export type FsWalkUpallbackResult = Promise<t.IgnoredResult> | t.IgnoredResult;
export type FsWalkUpCallbackArgs = {
  readonly dir: t.StringDir;
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
  toString(options?: t.FormatBytesOptions): string;
};
