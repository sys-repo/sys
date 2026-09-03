import type { t } from './common.ts';

/**
 * ZIP archive contracts.
 */
export declare namespace Zip {
  /** Public ZIP library surface. */
  export type Lib = {
    /** Owner-authenticated ZIP predicates. */
    readonly Is: Is.Lib;

    /** Open an owned ZIP byte snapshot. */
    readonly open: (bytes: Uint8Array, options: OpenOptions) => Promise<Archive>;
  };

  /** Immutable opened archive. */
  export type Archive = {
    readonly inspect: () => Inspection;
    readonly test: (options: WorkOptions) => Promise<TestResult>;
  };

  /** Options for opening an owned ZIP snapshot. */
  export type OpenOptions = WorkOptions & { limits?: Partial<Limits> };

  /** Cancellation and finite work budget shared by asynchronous operations. */
  export type WorkOptions = { until?: t.UntilInput; timeout: t.Msecs };

  /** Complete parser limit values available for optional override. */
  export type Limits = {
    maxSourceBytes: number;
    maxEntries: number;
    maxTreeEntries: number;
    maxPathBytes: number;
    maxPathDepth: number;
    maxEntryBytes: number;
    maxExpandedBytes: number;
    maxErrorChars: number;
  };

  /** Complete frozen structural inspection. */
  export type Inspection = {
    readonly format: Format;
    readonly sourceBytes: number;
    readonly fileCount: number;
    readonly directoryCount: number;
    readonly treeEntryCount: number;
    readonly compressedBytes: number;
    readonly expandedBytes: number;
    readonly usage: Usage;
    readonly entries: readonly Entry[];
  };

  /** Successful whole-archive payload-integrity evidence. */
  export type TestResult = {
    readonly kind: 'passed';
    readonly filesTested: number;
    readonly compressedBytes: number;
    readonly expandedBytes: number;
  };

  /** Frozen metadata for one admitted central-directory entry. */
  export type Entry = {
    readonly index: number;
    readonly path: string;
    readonly kind: EntryKind;
    readonly creatorSystem: CreatorSystem;
    readonly compression: Compression;
    readonly deflateOption: DeflateOption;
    readonly utf8: boolean;
    readonly dataDescriptor: boolean;
    readonly crc32: number;
    readonly compressedBytes: number;
    readonly expandedBytes: number;
    readonly localHeaderOffset: number;
  };

  /** Aggregate feature-use evidence. */
  export type Usage = {
    readonly storedEntries: number;
    readonly deflatedEntries: number;
    readonly utf8Entries: number;
    readonly descriptorEntries: number;
  };

  /** Supported archive grammar. */
  export type Format = 'zip32';

  /** Realized entry type. */
  export type EntryKind = 'file' | 'directory';

  /** Admitted creator-system convention. */
  export type CreatorSystem = 'ms-dos' | 'unix';

  /** Admitted payload encoding. */
  export type Compression = 'stored' | 'deflate';

  /** General-purpose DEFLATE option bits. */
  export type DeflateOption = 'none' | 'normal' | 'maximum' | 'fast' | 'super-fast';

  /** Public operation names carried by failures. */
  export type Operation = 'open' | 'test';

  /**
   * ZIP operation failure contracts.
   */
  export namespace Failure {
    /** Frozen public shape of an owner-authenticated ZIP failure. */
    export type Error = globalThis.Error & {
      readonly name: 'ZipError';
      readonly operation: Operation;
      readonly kind: Kind;
      readonly entryIndex?: number;
    };

    /** Stable failure classification. */
    export type Kind =
      | 'invalid-input'
      | 'invalid-options'
      | 'cancelled'
      | 'timeout'
      | 'source-limit'
      | 'entry-limit'
      | 'tree-limit'
      | 'path-limit'
      | 'expanded-limit'
      | 'malformed'
      | 'unsupported'
      | 'invalid-name'
      | 'collision'
      | 'deflate-failure'
      | 'size-mismatch'
      | 'crc-mismatch';
  }

  /**
   * ZIP predicate contracts.
   */
  export namespace Is {
    /** ZIP predicate library. */
    export type Lib = {
      /** Determine whether an input is an owner-authenticated ZIP failure. */
      failure(input: unknown): input is Failure.Error;
    };
  }
}
