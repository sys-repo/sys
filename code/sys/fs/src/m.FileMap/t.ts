import type { t } from './common.ts';

/** Represents a bundled set of paths/files as a structured object. */
export type FileMap = { [path: t.StringPath]: string };

/**
 * Tools for generating and saving bundles of files as a structured object.
 *
 * Useful for converting filesystem layouts into a simple object that can be embedded
 * within a module's source code.
 */
export declare namespace FileMap {
  /** Runtime library surface. */
  export type Lib = {
    /** Helpers for encoding/decoding file data. */
    readonly Data: Data.Lib;

    /** Boolean flag assertions. */
    readonly Is: Is.Lib;

    /** Convert a directory to an in-memory FileMap with sorted keys. */
    readonly toMap: ToMap.Method;

    /** Build a FileMap from a directory then write a single JSON artifact to a file. */
    readonly bundle: Bundle.Method;

    /** Parse a raw JSON value into a FileMap. */
    readonly validate: Validate.Method;

    /** Filter a FileMap, returning a new non-mutated instance. */
    readonly filter: Filter.Method;

    /** Materialize a FileMap into a target directory with optional per-file transforms. */
    readonly write: Write.Method;
  };

  /**
   * Helpers for encoding and decoding file data.
   */
  export namespace Data {
    /** File data codec library. */
    export type Lib = {
      /** Encode a file's text or bytes as a data URI. */
      encode(contentType: string, input: string | Uint8Array): string;

      /** Decode an encoded data URI into text or bytes. */
      decode(input: string): string | Uint8Array;

      /** Content-type derivation helpers. */
      readonly contentType: ContentType.Lib;
    };

    /**
     * Content-type derivation helpers.
     */
    export namespace ContentType {
      /** Content-type helper library. */
      export type Lib = {
        /** Derive a content-type from a filesystem path. */
        fromPath(path: t.StringPath): string;

        /** Derive a content-type from a data URI. */
        fromUri(uri: t.StringUri): string;
      };
    }
  }

  /**
   * Boolean flag assertions.
   */
  export namespace Is {
    /** FileMap predicate library. */
    export type Lib = {
      /** Determine if the given value is a file-map object. */
      fileMap(input?: unknown): input is t.FileMap;

      /** Determine if the given string is a data URI format (RFC 2397). */
      dataUri(input: string): boolean;

      /** Determine if the given path or filename is a dotfile, e.g. `.gitignore`. */
      dotfile(filename: string): boolean;

      /** Supported format predicates. */
      readonly supported: Supported.Lib;

      /** Content-type format predicates. */
      readonly contentType: ContentType.Lib;
    };

    /**
     * Supported format predicates.
     */
    export namespace Supported {
      /** Supported content predicate library. */
      export type Lib = {
        /** Determine if the given content-type is supported. */
        contentType(contentType: string): boolean;
      };
    }

    /**
     * Content-type format predicates.
     */
    export namespace ContentType {
      /** Content-type predicate library. */
      export type Lib = {
        /** Determine if the content-type is text-like. */
        string(contentType: string): boolean;

        /** Determine if the content-type is binary. */
        binary(contentType: string): boolean;
      };
    }
  }

  /**
   * Directory-to-map conversion contracts.
   */
  export namespace ToMap {
    /** Convert a directory to an in-memory FileMap with sorted keys. */
    export type Method = (dir: t.StringDir, options?: OptionsInput) => Promise<t.FileMap>;

    /** Options accepted by `FileMap.toMap`. */
    export type Options = { filter?: Filter.Predicate };

    /** Flexible input accepted by `FileMap.toMap`. */
    export type OptionsInput = Options | Filter.Predicate;
  }

  /**
   * FileMap filter contracts.
   */
  export namespace Filter {
    /** Filter a FileMap, returning a new non-mutated instance. */
    export type Method = (filemap: t.FileMap, fn: Predicate) => t.FileMap;

    /** Predicate used to keep or drop a file-map entry. */
    export type Predicate = (e: Args) => boolean;

    /** Arguments supplied to the FileMap filter predicate. */
    export type Args = {
      readonly path: t.StringPath;
      readonly filename: string;
      readonly ext: string;
      readonly contentType: t.StringContentType;
      readonly value: string;
    };
  }

  /**
   * Bundle contracts.
   */
  export namespace Bundle {
    /** Build a FileMap from a directory then write a single JSON artifact to a file. */
    export type Method = (
      sourceDir: t.StringDir,
      options: OptionsInput,
    ) => Promise<Result>;

    /** Flexible input accepted by `FileMap.bundle`. */
    export type OptionsInput = Options | Options['targetFile'];

    /** Options for `FileMap.bundle`. */
    export type Options = ToMap.Options & {
      /** File path to write the JSON artifact into. */
      readonly targetFile: t.StringPath;

      /** Handler called by the bundler immediately before writing to disk. */
      readonly beforeWrite?: BeforeWrite.Method;
    };

    /** Result from `FileMap.bundle`. */
    export type Result = {
      /** Number of entries in the map. */
      readonly count: number;

      /** The in-memory map. */
      readonly fileMap: t.FileMap;

      /** Absolute path of the artifact written to disk. */
      readonly file: t.StringPath;

      /** Flag indicating if a `beforeWrite` handler modified the bundle. */
      readonly modified: boolean;
    };

    /**
     * Bundle pre-write hook contracts.
     */
    export namespace BeforeWrite {
      /** Handler called by the bundler immediately before writing to disk. */
      export type Method = (e: Args) => void;

      /** Arguments passed to a bundle pre-write hook. */
      export type Args = {
        /** The in-memory map. */
        readonly fileMap: t.FileMap;

        /** Absolute path of the artifact written to disk. */
        readonly file: t.StringPath;

        /** Signal that a modified version should be written to disk. */
        modify(next: t.FileMap): void;
      };
    }
  }

  /**
   * Validation contracts.
   */
  export namespace Validate {
    /** Parse a raw JSON value into a FileMap. */
    export type Method = (json: unknown) => Result;

    /** Result of parsing a raw JSON value into a FileMap. */
    export type Result = { readonly fileMap?: t.FileMap; readonly error?: t.StdError };
  }

  /**
   * Write/materialization contracts.
   */
  export namespace Write {
    /** Materialize a FileMap into a target directory with optional per-file transforms. */
    export type Method = (
      map: t.FileMap,
      dir: t.StringDir,
      options?: Options,
    ) => Promise<Result>;

    /** Options for applying a FileMap into a target directory. */
    export type Options = {
      readonly dryRun?: boolean;
      readonly force?: boolean;
      readonly ctx?: unknown;
      readonly processFile?: Processor.Method;
    };

    /** Result of materializing a FileMap into the filesystem. */
    export type Result = {
      readonly ops: readonly Op.Any[];
      readonly total: { readonly [K in Op.Any['kind']]: number };
    };

    /**
     * Per-file processing contracts.
     */
    export namespace Processor {
      /** Function signature for per-file transforms during write operations. */
      export type Method = (e: Args) => void | Promise<void>;

      /** Per-file process callback exposed via `processFile` callback. */
      export type Args = {
        readonly ctx?: unknown;
        readonly path: t.StringPath;
        readonly contentType: string;
        readonly text?: string;
        readonly bytes?: Uint8Array;
        readonly target: {
          readonly dir: t.StringDir;
          readonly absolute: t.StringPath;
          readonly relative: t.StringPath;
          readonly filename: t.StringName;
          exists(): Promise<boolean>;
          rename(next: string, silent?: boolean): void;
        };
        skip(reason?: string): void;
        modify(next: string | Uint8Array): void;
      };
    }

    /**
     * Write operation contracts.
     */
    export namespace Op {
      /** Operation emitted during `FileMap.write`. */
      export type Any =
        | ({ kind: 'create'; path: t.StringPath; renamed?: Renamed } & Common)
        | ({ kind: 'modify'; path: t.StringPath; renamed?: Renamed } & Common)
        | ({ kind: 'skip'; path: t.StringPath; reason?: string } & Common);

      /** Common write operation metadata. */
      export type Common = { dryRun?: boolean; forced?: boolean };

      /** Metadata added to a write operation when the file was renamed. */
      export type Renamed = { from: t.StringPath; silent?: boolean };

      /** Pick out operations whose `kind` matches K. */
      export type OfKind<K extends Any['kind']> = Extract<Any, { kind: K }>;
    }
  }
}

/** Compatibility alias for the legacy flat type surface. */
export type FileMapLib = FileMap.Lib;
/** Compatibility alias for the legacy flat type surface. */
export type FileMapDataLib = FileMap.Data.Lib;
/** Compatibility alias for the legacy flat type surface. */
export type FileMapIsLib = FileMap.Is.Lib;
/** Compatibility alias for the legacy flat type surface. */
export type FileMapToMap = FileMap.ToMap.Method;
/** Compatibility alias for the legacy flat type surface. */
export type FileMapToMapOptions = FileMap.ToMap.Options;
/** Compatibility alias for the legacy flat type surface. */
export type FileMapFilter = FileMap.Filter.Predicate;
/** Compatibility alias for the legacy flat type surface. */
export type FileMapFilterArgs = FileMap.Filter.Args;
/** Compatibility alias for the legacy flat type surface. */
export type FileMapBundle = FileMap.Bundle.Method;
/** Compatibility alias for the legacy flat type surface. */
export type FileMapBundleOptions = FileMap.Bundle.Options;
/** Compatibility alias for the legacy flat type surface. */
export type FileMapBundleResult = FileMap.Bundle.Result;
/** Compatibility alias for the legacy flat type surface. */
export type FileMapBundleBeforeWrite = FileMap.Bundle.BeforeWrite.Method;
/** Compatibility alias for the legacy flat type surface. */
export type FileMapBundleBeforeWriteArgs = FileMap.Bundle.BeforeWrite.Args;
/** Compatibility alias for the legacy flat type surface. */
export type FileMapValidateResult = FileMap.Validate.Result;
/** Compatibility alias for the legacy flat type surface. */
export type FileMapWrite = FileMap.Write.Method;
/** Compatibility alias for the legacy flat type surface. */
export type FileMapWriteOptions = FileMap.Write.Options;
/** Compatibility alias for the legacy flat type surface. */
export type FileMapWriteResult = FileMap.Write.Result;
/** Compatibility alias for the legacy flat type surface. */
export type FileMapProcessor = FileMap.Write.Processor.Method;
/** Compatibility alias for the legacy flat type surface. */
export type FileMapProcessorArgs = FileMap.Write.Processor.Args;
/** Compatibility alias for the legacy flat type surface. */
export type FileMapOp = FileMap.Write.Op.Any;
/** Compatibility alias for the legacy flat type surface. */
export type FileMapOpCommon = FileMap.Write.Op.Common;
/** Compatibility alias for the legacy flat type surface. */
export type FileMapOpRenamed = FileMap.Write.Op.Renamed;
/** Compatibility alias for the legacy flat type surface. */
export type FileMapOpOfKind<K extends FileMapOp['kind']> = FileMap.Write.Op.OfKind<K>;
