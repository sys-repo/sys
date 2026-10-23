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
  /** Runtime FileMap API. */
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
    export type Options = {
      /** Keep only file entries accepted by this predicate. */
      filter?: Filter.Predicate;
    };

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
    export type Result = {
      /** Parsed file map when validation succeeds. */
      readonly fileMap?: t.FileMap;
      /** Validation error when the input is not a FileMap. */
      readonly error?: t.StdError;
    };
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
      /** Report planned operations without writing files. */
      readonly dryRun?: boolean;
      /** Overwrite existing unchanged targets when true. */
      readonly force?: boolean;
      /** Caller context passed through to each processor callback. */
      readonly ctx?: unknown;
      /** Optional per-file transform hook before write decisions are finalized. */
      readonly processFile?: Processor.Method;
    };

    /** Result of materializing a FileMap into the filesystem. */
    export type Result = {
      /** Ordered operation log for every input file-map entry. */
      readonly ops: readonly Op.Any[];
      /** Lazy totals grouped by operation kind. */
      readonly total: {
        /** Number of created files. */
        readonly create: number;
        /** Number of modified files. */
        readonly modify: number;
        /** Number of skipped files. */
        readonly skip: number;
      };
    };

    /**
     * Per-file processing contracts.
     */
    export namespace Processor {
      /** Function signature for per-file transforms during write operations. */
      export type Method = (e: Args) => void | Promise<void>;

      /** Per-file process callback exposed via `processFile` callback. */
      export type Args = {
        /** Caller context passed from write options. */
        readonly ctx?: unknown;
        /** Original file-map path key. */
        readonly path: t.StringPath;
        /** Content type decoded from the file-map data URI. */
        readonly contentType: string;
        /** Text payload for string-like content types. */
        readonly text?: string;
        /** Binary payload for non-text content types. */
        readonly bytes?: Uint8Array;
        /** Mutable target path facade for the output file. */
        readonly target: {
          /** Root directory receiving materialized files. */
          readonly dir: t.StringDir;
          /** Absolute output path after any rename. */
          readonly absolute: t.StringPath;
          /** Relative output path after any rename. */
          readonly relative: t.StringPath;
          /** Output filename after any rename. */
          readonly filename: t.StringName;
          /** Test whether the current target path already exists. */
          exists(): Promise<boolean>;
          /** Rename this output path before write classification. */
          rename(next: string, silent?: boolean): void;
        };
        /** Mark this file-map entry as skipped. */
        skip(reason?: string): void;
        /** Replace the decoded output payload before writing. */
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
      export type Common = {
        /** True when the operation was planned but not written. */
        dryRun?: boolean;
        /** True when an existing file was overwritten because force was enabled. */
        forced?: boolean;
      };

      /** Metadata added to a write operation when the file was renamed. */
      export type Renamed = {
        /** Previous relative output path. */
        from: t.StringPath;
        /** Suppress rename presentation in callers that render the op log. */
        silent?: boolean;
      };

      /** Pick out operations whose `kind` matches K. */
      export type OfKind<K extends Any['kind']> = Extract<Any, { kind: K }>;
    }
  }
}
