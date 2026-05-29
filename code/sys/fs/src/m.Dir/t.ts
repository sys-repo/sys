import type { t } from './common.ts';

/**
 * Filesystem directory helper contracts.
 */
export declare namespace Dir {
  /** Helpers for working with filesystem directories. */
  export type Lib = {
    /** Directory hash helpers. */
    readonly Hash: Hash.Lib;
  };

  /**
   * Directory hash contracts.
   */
  export namespace Hash {
    /** Directory hash helper library. */
    export type Lib = {
      /** Hash-related console formatting helpers. */
      readonly Fmt: t.HashFmtLib;

      /** Calculate the hash of a directory. */
      readonly compute: Compute.Method;

      /** Verify a directory against a composite hash or hash file. */
      readonly verify: Verify.Method;
    };

    /** Directory hash operation result. */
    export type Result = {
      /** The composite hash value. */
      readonly hash: t.CompositeHash;

      /** Absolute path to the base directory the relative file hashes pertain to. */
      readonly dir: t.StringDir;

      /** Whether the directory path exists. */
      readonly exists: boolean;

      /** Error details when the operation failed. */
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
      ) => Promise<Result>;

      /** Options passed to `Dir.Hash.compute`. */
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

      /** Response from `Dir.Hash.verify`. */
      export type Response = Result & {
        readonly is: t.HashVerifyResponse['is'];
      };
    }
  }
}
