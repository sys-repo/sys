import type * as StdFs from '@std/fs';
import type * as StdPath from '@std/path';

import type { WalkEntry } from '@std/fs';
import type { t } from './common.ts';

export type * from './t/t.Dir.ts';
export type * from './t/t.File.ts';
export type * from './t/t.Fmt.ts';
export type { WalkEntry };

type Methods = StdMethods & DenoMethods & NamespaceMembers & GlobMethods;

/**
 * Tools for working with the file-system.
 */
export namespace Fs {
  /** Full filesystem, path, file, and watch helper API. */
  export type Lib = Methods & {
    /** Retrieve information about the given path. */
    readonly stat: GetStat;

    /** Retrieve information about the given path without following a final symlink. */
    readonly lstat: GetStat;

    /** Rename a file or directory without copy/delete fallback semantics. */
    readonly rename: Rename;

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

    /** Walk upward until the callback returns the first defined result. */
    readonly findAncestor: FindAncestor;

    /** Start a file-system watcher. */
    readonly watch: t.Watch.Lib['start'];

    /**
     * Current working directory.
     *
     * - `process`: current process cwd (`Deno.cwd()`).
     * - `terminal`: initiating terminal cwd when the pseudo-standard
     *   `INIT_CWD` env var is present, otherwise falls back to `Deno.cwd()`.
     */
    cwd(kind?: 'process' | 'terminal'): t.StringDir;

    /** Removes the CWD (current-working-directory) from the given path if it exists. */
    trimCwd: t.FsPath.Lib['trimCwd'];

    /** Generator function that produces `FsFile` data-structures. */
    toFile: t.FsFileFactory;

    /** Generator function that produces `FsDir` data-structures. */
    toDir: t.FsDirFactory;

    /** Create a new temporary directory and return it as an FsDir handle. */
    makeTempDir: MakeTempDir;
  };

  /**
   * Filesystem capability adapter contracts.
   */
  export namespace Capability {
    /** Adapter API for building portable filesystem capabilities. */
    export type Lib = t.FsCapability.Lib;
    /** Portable filesystem capability instance. */
    export type Instance = t.FsCapability.Instance;
  }

  /**
   * Bounded stable snapshot contracts.
   */
  export namespace Snapshot {
    /** Runtime file-snapshot library. */
    export type Lib = {
      /** Owner-authenticated snapshot predicates. */
      readonly Is: Is.Lib;

      /** Read one bounded stable snapshot through one file handle. */
      readonly file: File.Method;
    };

    /**
     * File snapshot contracts.
     */
    export namespace File {
      /** Read one bounded stable snapshot through one file handle. */
      export type Method = (options: Options) => Promise<Result>;

      /** Mutable caller options snapshotted before filesystem work. */
      export type Options = {
        root: t.StringAbsoluteDir;
        path: t.StringAbsolutePath;
        maxBytes: t.NumberBytes;
        until?: t.UntilInput;
        timeout: t.Msecs;
      };

      /** Frozen result containing exclusively owned file bytes. */
      export type Result = {
        readonly path: t.StringAbsolutePath;
        readonly byteLength: t.NumberBytes;
        readonly evidence: Evidence.Kind;
        readonly bytes: Uint8Array;
      };
    }

    /**
     * Snapshot evidence contracts.
     */
    export namespace Evidence {
      /** Strength of final-file identity evidence available from the host. */
      export type Kind = 'device-inode' | 'metadata-only';
    }

    /**
     * Snapshot failure contracts.
     */
    export namespace Failure {
      /** Frozen owner-authenticated snapshot failure. */
      export type Error = globalThis.Error & {
        readonly name: 'FsSnapshotError';
        readonly operation: 'file';
        readonly kind: Kind;
      };

      /** Stable file-snapshot failure classification. */
      export type Kind =
        | 'invalid-options'
        | 'invalid-root'
        | 'invalid-path'
        | 'cancelled'
        | 'timeout'
        | 'missing'
        | 'source-limit'
        | 'unsafe-filesystem'
        | 'source-changed'
        | 'permission-denied'
        | 'io-failure';
    }

    /**
     * Snapshot predicate contracts.
     */
    export namespace Is {
      /** Snapshot predicate library. */
      export type Lib = {
        /** Determine whether an input is an owner-authenticated snapshot failure. */
        failure(input: unknown): input is Failure.Error;
      };
    }
  }

  /**
   * Filesystem path helper contracts.
   */
  export namespace Path {
    /** Filters on an absolute path. */
    export type Filter = (path: t.StringAbsolutePath) => boolean;
  }

  /**
   * Filesystem/Path type verification flags.
   */
  export type IsLib = t.Path.Lib['Is'] & {
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
  /** Native Deno file metadata returned by stat operations. */
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
  export type CopyFile = (
    from: t.StringPath,
    to: t.StringPath,
    options?: t.Fs.CopyFileOptions | t.FsCopyFilter,
  ) => Promise<t.Fs.CopyResult>;

  /** Rename a file or directory without copy/delete fallback semantics. */
  export type Rename = (from: t.StringPath, to: t.StringPath) => Promise<void>;

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

  /** Options passed to a single-file copy operation. */
  export type CopyFileOptions = t.Fs.CopyOptions & {
    /** Ensure the target parent directory exists before copying (default: true). */
    ensureParent?: boolean;
  };

  /** Response from the `Fs.copy` method. */
  export type CopyResult = {
    /** Copy failure details when the operation did not complete cleanly. */
    error?: t.StdError;
  };

  /**
   * Delete a file or directory (and its contents).
   */
  export type Remove = (path: t.StringPath, options?: RemoveOptions) => Promise<boolean>;
  /** Options that control filesystem removal behavior. */
  export type RemoveOptions = {
    /** Print the intended removal without mutating the file-system (default: false). */
    dryRun?: boolean;
    /** Write removal metadata to the console (default: false). */
    log?: boolean;
    /** Recursively remove directories and their contents (default: true). */
    recursive?: boolean;
  };

  /** Options passed to `Fs.resolve`. */
  export type ResolveOptions = {
    /** Expand leading "~" / "~/" segments using the active HOME binding. */
    readonly expandTilde?: boolean;
  };

  /** Resolve path segments into an absolute path with optional fs policy. */
  export type Resolve = {
    (...parts: readonly string[]): string;
    (...parts: readonly [...string[], ResolveOptions]): string;
  };

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
    /** Overwrite existing files (default: true). */
    force?: boolean;
    /** Reject write failures instead of returning them (default: false). */
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
    /** True when the file was read and parsed successfully. */
    readonly ok: boolean;
    /** Whether the target path existed when read was attempted. */
    readonly exists: boolean;
    /** Absolute resolved path that was read. */
    readonly path: string;
    /** Parsed file data when the read succeeds. */
    readonly data?: T;
    /** Standard error when read, decode, or parse fails. */
    readonly error?: t.StdError;
    /** Machine-readable failure category. */
    readonly errorReason?: 'NotFound' | 'ParseError' | 'DecodingError' | 'Unknown';
  };

  /**
   * Recursively walk up a directory tree (visitor pattern).
   */
  export type WalkUp = (startAt: t.StringPath, onVisit: WalkUpCallback) => Promise<void>;
  /** Visitor invoked for each ancestor while walking upward. */
  export type WalkUpCallback = (e: WalkUpCallbackArgs) => WalkUpCallbackResult;
  /** Result returned by a walk-up visitor. */
  export type WalkUpCallbackResult = Promise<t.IgnoredResult> | t.IgnoredResult;
  /** Arguments supplied to a walk-up visitor. */
  export type WalkUpCallbackArgs = {
    /** Current ancestor directory being visited. */
    readonly dir: t.StringDir;
    /** List files directly under the current directory. */
    files(): Promise<WalkFile[]>;
    /** Stop walking after the current visitor returns. */
    stop(): void;
  };

  /**
   * Walk upward until the callback returns the first defined result.
   */
  export type FindAncestor = <T = t.StringDir>(
    start: t.StringPath,
    onVisit: FindAncestorCallback<T>,
  ) => Promise<T | undefined>;
  /** Visitor that returns the first matching ancestor result. */
  export type FindAncestorCallback<T> = (
    e: t.Fs.WalkUpCallbackArgs,
  ) => Promise<T | undefined> | T | undefined;

  /**
   * Details about a walked file.
   */
  export type WalkFile = {
    /** Absolute path to the walked entry. */
    path: t.StringPath;
    /** Parent directory of the walked entry. */
    dir: t.StringDir;
    /** Basename of the walked entry. */
    name: string;
    /** Whether the walked entry is a symlink. */
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
    /** Whether the measured directory exists. */
    readonly exists: boolean;
    /** Directory path that was measured. */
    readonly path: t.StringDir;
    /** Aggregated file count and byte size. */
    readonly total: {
      /** Number of files included in the total. */
      files: number;
      /** Total byte size across included files. */
      bytes: number;
    };
    /** Format the byte total as a display string. */
    toString(options?: t.FormatBytesOptions): string;
  };

  /**
   * Create a new temporary directory and return it as an FsDir handle.
   */
  export type MakeTempDir = (options?: t.Fs.MakeTempDirOptions) => Promise<t.FsDir>;
  /** Options passed to temporary directory creation. */
  export type MakeTempDirOptions = {
    /** Parent directory for the temporary directory. */
    readonly dir?: t.StringDir;
    /** Prefix for the generated directory name. */
    readonly prefix?: string;
    /** Suffix for the generated directory name. */
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
  /** Filesystem capability APIs. */
  readonly Capability: t.Fs.Capability.Lib;

  /** Bounded stable file snapshots. */
  readonly Snapshot: t.Fs.Snapshot.Lib;

  /** Helpers for working with resource paths. */
  readonly Path: t.FsPath.Lib;

  /** File-system/path type verification flags. */
  readonly Is: t.Fs.IsLib;

  /** Helpers for calculating file sizes. */
  readonly Size: t.Fs.SizeLib;

  /** Helpers for watching file-system changes. */
  readonly Watch: t.Watch.Lib;

  /** Formatting helpers (pretty console output). */
  readonly Fmt: t.FsFmtLib;

  /** Tilde (~) home path helpers. */
  readonly Tilde: t.Fs.TildeLib;
};

type GlobMethods = {
  /** List file paths within a directory using glob matching. */
  readonly ls: t.Glob.PathList;

  /** Factory for a glob helper. */
  readonly glob: t.Glob.Factory;
};

/**
 * Methods from the `@std` libs.
 */
type StdMethods = {
  /** Joins a sequence of paths, then normalizes the resulting path. */
  readonly join: t.Path.Lib['join'];

  /** Resolves path segments into a path. */
  readonly resolve: t.Fs.Resolve;

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
