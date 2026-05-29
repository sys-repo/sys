import type { t } from './common.ts';

/**
 * Directory hashing contracts.
 */
export declare namespace DirHash {
  /** Directory hashing helper library. */
  export type Lib = {
    /** Hash related console logging helpers. */
    readonly Fmt: t.HashFmtLib;

    /** Calculate the hash of a directory. */
    readonly compute: Compute.Method;

    /** Verify a directory against a composite hash or hash file. */
    readonly verify: Verify.Method;
  };

  /** Result from hashing a directory. */
  export type Result = {
    /** The composite hash value. */
    readonly hash: t.CompositeHash;

    /** Path to the base directory the relative filepath hashes pertain to. */
    readonly dir: t.StringDir;

    /** Flag indicating if the directory exists. */
    readonly exists: boolean;

    /** Error details if any occurred. */
    readonly error?: t.StdError;
  };

  /**
   * Directory hash computation contracts.
   */
  export namespace Compute {
    /** Calculate the hash of a directory. */
    export type Method = (
      dir: t.StringDir,
      options?: Options | t.Fs.Path.Filter,
    ) => Promise<DirHash.Result>;

    /** Options passed to `DirHash.compute`. */
    export type Options = {
      filter?: t.Fs.Path.Filter;
      onProgress?: (e: ProgressEvent) => t.Awaitable<void>;
    };

    /** Progress emitted for each hashed file. */
    export type ProgressEvent = {
      readonly dir: t.StringDir;
      readonly path: t.StringRelativePath;
      readonly current: number;
      readonly total: number;
    };
  }

  /**
   * Directory hash verification contracts.
   */
  export namespace Verify {
    /** Verify a directory against a composite hash or hash file. */
    export type Method = (dir: t.StringDir, input: Input) => Promise<Response>;

    /** Composite hash object or path to a JSON file containing `{ hash }`. */
    export type Input = t.CompositeHash | t.StringPath;

    /** Result from verifying a directory hash. */
    export type Response = DirHash.Result & {
      readonly is: t.HashVerifyResponse['is'];
    };
  }
}
