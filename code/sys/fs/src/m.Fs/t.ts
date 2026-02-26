import type * as StdFs from '@std/fs';
import type * as StdPath from '@std/path';

import type { WalkEntry } from '@std/fs';
import type { t } from './common.ts';

export type * from './t.Dir.ts';
export type * from './t.File.ts';
export type * from './t.Fmt.ts';
export type { WalkEntry };

type Methods = StdMethods & DenoMethods & NamespaceMembers & GlobMethods;

/**
 * Tools for working with the file-system.
 */
export namespace Fs {
  export type Lib = Methods & {
    /** Retrieve information about the given path. */
    readonly stat: GetStat;

    /** Writes a string or binary file ensuring it's parent directory exists. */
    readonly write: WriteFile;

    /** Writes a JSON serializable value to a string of JSON to a file. */
    readonly writeJson: WriteJson;

    /** Copy a file or directory. */
    readonly copy: Copy;

    /** Copy all files in a directory. */
    readonly copyDir: CopyDir;

    /** Copy a single file. */
    readonly copyFile: CopyFile;

    /** Remove a file or directory if it exists. */
    readonly remove: Remove;

    /** Asynchronously reads and returns the entire contents of a binary file (Uint8Array). */
    readonly read: ReadBinary;

    /** Asynchronously reads and returns the entire contents of a text file. */
    readonly readText: ReadText;

    /** Asynchronously reads and returns the entire contents of a file as strongly-typed, parsed JSON. */
    readonly readJson: ReadJson;

    /** Asynchronously reads and returns the entire contents of a file as strongly-typed, parsed JSON. */
    readonly readYaml: ReadYaml;

    /** Recursively walk up a directory tree (visitor pattern). */
    readonly walkUp: WalkUp;

    /** Start a file-system watcher. */
    readonly watch: t.FsWatchLib['start'];

    /** Current working directory. */
    cwd(kind?: 'process' | 'terminal'): t.StringDir;

    /** Removes the CWD (current-working-directory) from the given path if it exists. */
    trimCwd: t.FsPathLib['trimCwd'];

    /** Generator function that produces `FsFile` data-structures. */
    toFile: t.FsFileFactory;

    /** Generator function that produces `FsDir` data-structures. */
    toDir: t.FsDirFactory;

    /** Create a new temporary directory and return it as an FsDir handle. */
    makeTempDir: MakeTempDir;
  };

  /** Re-exposed capability sub-surface (owned by `m.Fs.capability`). */
  export namespace Capability {
    export type Lib = t.FsCapability.Lib;
    export type Instance = t.FsCapability.Instance;
  }

  /**
   * Filesystem/Path type verification flags.
   */
  export type IsLib = t.PathLib['Is'] & {
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
  export type GetStat = (path: t.StringPath | URL) => Promise<FileInfo | undefined>;
  export type FileInfo = Deno.FileInfo;

  /**
   * Copy a file or directory.
   */
  export type Copy = (
    from: t.StringPath,
    to: t.StringPath,
    options?: t.Fs.CopyOptions | t.FsCopyFilter,
  ) => Promise<t.Fs.CopyResult>;

  /** Copy all files in a directory. */
  export type CopyDir = t.Fs.Copy;

  /** Copy an individual file. */
  export type CopyFile = t.Fs.Copy;

  /** Options passed to a file-system copy operation. */
  export type CopyOptions = {
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
  export type CopyResult = { error?: t.StdError };

  /**
   * Delete a file or directory (and its contents).
   */
  export type Remove = (
    path: string,
    options?: { dryRun?: boolean; log?: boolean },
  ) => Promise<boolean>;

  /**
   * Writes a string or binary file ensuring it's parent directory exists.
   */
  export type WriteFile = (
    path: t.StringPath,
    data: string | Uint8Array,
    options?: WriteFileOptions,
  ) => Promise<WriteFileResult>;

  /** Options passed to the `Fs.write` method. */
  export type WriteFileOptions = {
    /** Overwrite existing directory files (default: false). */
    force?: boolean;
    /** Flag indicating if errors should be thrown (default: false). */
    throw?: boolean;
  };

  /** Response from the `Fs.write` method. */
  export type WriteFileResult = {
    readonly overwritten: boolean;
    readonly error?: t.StdError;
  };

  /**
   * Writes a JSON serializable value to a string of JSON to a file.
   */
  export type WriteJson = (
    path: t.StringPath,
    data: t.Json,
    options?: t.Fs.WriteFileOptions,
  ) => Promise<WriteFileResult>;

  /**
   * Asynchronously reads and returns the entire contents of a binary file (Uint8Array).
   */
  export type ReadBinary = (path: t.StringPath) => Promise<ReadResult<Uint8Array>>;

  /**
   * Asynchronously reads and returns the entire contents of a text file.
   */
  export type ReadText = (path: t.StringPath) => Promise<ReadResult<string>>;

  /**
   * Asynchronously reads and returns the entire contents of a file
   * as strongly-typed, parsed JSON.
   */
  export type ReadJson = <T>(path: t.StringPath) => Promise<ReadResult<T>>;

  /**
   * Asynchronously reads and returns the entire contents of a file
   * as strongly-typed, parsed YAML.
   */
  export type ReadYaml = <T>(path: t.StringPath) => Promise<ReadResult<T>>;

  /** A response from a file read operation. */
  export type ReadResult<T> = {
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
  export type WalkUp = (startAt: t.StringPath, onVisit: WalkUpCallback) => Promise<void>;
  export type WalkUpCallback = (e: WalkUpCallbackArgs) => WalkUpCallbackResult;
  export type WalkUpCallbackResult = Promise<t.IgnoredResult> | t.IgnoredResult;
  export type WalkUpCallbackArgs = {
    readonly dir: t.StringDir;
    files(): Promise<WalkFile[]>;
    stop(): void;
  };

  /**
   * Details about a walked file.
   */
  export type WalkFile = {
    path: t.StringPath;
    dir: t.StringDir;
    name: string;
    isSymlink: boolean;
  };

  /**
   * Tools for calculating file sizes.
   */
  export type SizeLib = {
    /**
     * Walk a directory and total up the file sizes.
     */
    dir(path: t.StringDir, options?: { maxDepth?: number }): Promise<DirSize>;
  };

  /**
   * Represents the byte-size of all files within a directory.
   */
  export type DirSize = {
    readonly exists: boolean;
    readonly path: t.StringDir;
    readonly total: { files: number; bytes: number };
    toString(options?: t.FormatBytesOptions): string;
  };

  /**
   * Create a new temporary directory and return it as an FsDir handle.
   */
  export type MakeTempDir = (options?: t.Fs.MakeTempDirOptions) => Promise<t.FsDir>;
  export type MakeTempDirOptions = {
    readonly dir?: t.StringDir;
    readonly prefix?: string;
    readonly suffix?: string;
  };

  /**
   * Tilde (~) home path helpers.
   */
  export type TildeLib = {
    /**
     * Expand a leading "~" or "~/" to the current user's home directory.
     * Returns the input unchanged when no expansion applies.
     */
    expand(input: t.StringPath): t.StringPath;

    /**
     * Collapse the user's home directory to a leading "~" when applicable.
     * Returns the input unchanged when no collapse applies.
     */
    collapse(input: t.StringPath): t.StringPath;
  };
}

/**
 * Sub-namespace properties.
 */
type NamespaceMembers = {
  readonly Capability: t.Fs.Capability.Lib;

  /** Helpers for working with resource paths. */
  readonly Path: t.FsPathLib;

  /** File-system/path type verification flags. */
  readonly Is: t.Fs.IsLib;

  /** Helpers for calculating file sizes. */
  readonly Size: t.Fs.SizeLib;

  /** Helpers for watching file-system changes. */
  readonly Watch: t.FsWatchLib;

  /** Formatting helpers (pretty console output). */
  readonly Fmt: t.FsFmtLib;

  /** Tilde (~) home path helpers. */
  readonly Tilde: t.Fs.TildeLib;
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
  readonly join: t.PathLib['join'];

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

  /** Asynchronously moves a file or directory (along with its contents). */
  readonly move: typeof StdFs.move;
};

/**
 * Deno file-system methods.
 */
type DenoMethods = {
  /** Resolves to the absolute normalized path, with symbolic links resolved. */
  readonly realPath: typeof Deno.realPath;
};
