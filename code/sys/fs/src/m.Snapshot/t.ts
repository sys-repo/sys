import type { t } from './common.ts';

/**
 * Bounded stable filesystem snapshot contracts.
 */
export declare namespace Snapshot {
  /**
   * Runtime file-snapshot library.
   */
  export type Lib = {
    /** Owner-authenticated snapshot predicates. */
    readonly Is: Is.Lib;

    /**
     * Read one bounded stable snapshot through one file handle.
     */
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
    /**
     * Snapshot predicate library.
     */
    export type Lib = {
      /**
       * Determine whether an input is an owner-authenticated snapshot failure.
       */
      failure(input: unknown): input is Failure.Error;
    };
  }
}
