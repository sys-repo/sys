import type { t } from './common.ts';

/**
 * In-memory readonly backing adapter for the Files model.
 */
export declare namespace FilesMemory {
  /** Runtime library surface. */
  export type Lib = {
    /** Create a bounded readonly Files backing from an in-memory file map. */
    readonly readonly: (options?: ReadonlyOptions) => Readonly;
  };

  /** Bounded readonly in-memory Files backing. */
  export type Readonly = {
    readonly kind: 'files/memory:readonly';
    readonly policy: t.Files.Policy.Shape;
    readonly capabilities: t.Files.Capabilities;
    readonly handlers: t.Files.Cmd.HandlerMap;
  };

  /** Options for creating a readonly in-memory Files backing. */
  export type ReadonlyOptions = {
    /** File content keyed by canonical root-relative Files path. */
    readonly files?: FileMap;

    /** Additional empty directories to expose. Parent directories are derived automatically. */
    readonly dirs?: readonly t.Files.StringPath[];

    /** Files access policy. Defaults to deny-all. */
    readonly policy?: t.Files.Policy.Shape;

    /** Maximum bytes returned by `files:read`. */
    readonly maxReadBytes?: t.NumberBytes;

    /** Default page size for list/manifest results. */
    readonly defaultLimit?: t.NumberTotal;
  };

  /** In-memory file map keyed by root-relative Files path. */
  export type FileMap = { readonly [path: t.Files.StringPath]: FileInput };

  /** File shorthand or structured file metadata. */
  export type FileInput = string | File;

  /** Structured in-memory file metadata. */
  export type File = {
    readonly content: string;
    readonly modified?: t.StringIsoDate;
    readonly hash?: t.StringHash;
    readonly mediaType?: t.StringMimeType;
  };

  /** Files/memory error surface. */
  export namespace Error {
    export type Kind = `FilesMemoryError.${t.Files.Error.KindSuffix}`;
  }
}
