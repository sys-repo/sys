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
      readonly Fmt: t.HashFmt.Lib;

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
        /** Keep only paths accepted by this absolute-path filter. */
        filter?: t.Fs.Path.Filter;
        /** Optional callback invoked after each file hash is added. */
        onProgress?: (e: ProgressEvent) => t.Awaitable<void>;
      };

      /** Progress emitted for each hashed file. */
      export type ProgressEvent = {
        /** Absolute directory being hashed. */
        readonly dir: t.StringDir;
        /** Directory-relative file path just hashed. */
        readonly path: t.StringRelativePath;
        /** One-based file index for the current progress event. */
        readonly current: number;
        /** Total number of files selected for hashing. */
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
        readonly is: t.CompositeHash.Verify.Response['is'];
      };
    }
  }
}
