import type { t } from './common.ts';

/**
 * Readonly filesystem-shaped backing adapter for the Files model.
 */
export declare namespace FilesFs {
  /** Runtime library surface. */
  export type Lib = {
    /** Create a bounded readonly Files backing from a structural filesystem capability. */
    readonly readonly: (options: ReadonlyOptions) => Readonly;
  };

  /** Bounded readonly Files backing. */
  export type Readonly = {
    readonly kind: 'files/fs:readonly';
    readonly policy: t.Files.Policy.Shape;
    readonly capabilities: t.Files.Capabilities;
    readonly handlers: t.Files.Cmd.HandlerMap;
  };

  /** Options for creating a readonly Files backing. */
  export type ReadonlyOptions = {
    /** Structural filesystem capability. */
    readonly fs: Capability.Readonly;

    /** Host/backing root. Never exposed through Files results. */
    readonly root: t.StringPath;

    /** Files access policy. Defaults to deny-all. */
    readonly policy?: t.Files.Policy.Shape;

    /** Maximum bytes returned by `files:read`. */
    readonly maxReadBytes?: t.NumberBytes;

    /** Default page size for list/manifest results. */
    readonly defaultLimit?: t.NumberTotal;
  };

  /** Structural capabilities required by the readonly Files backing. */
  export namespace Capability {
    export type Readonly = {
      /** Path operations with the same semantics as the backing. */
      readonly path: Path;

      /** Resolve real/canonical path, following symlinks. */
      readonly realPath: (path: t.StringPath) => t.Awaitable<t.StringAbsolutePath | undefined>;

      /** Stat a backing path. */
      readonly stat: (path: t.StringPath) => t.Awaitable<Stat | undefined>;

      /** Read UTF-8 text content from a backing path. */
      readonly readText: (path: t.StringPath) => t.Awaitable<string | undefined>;

      /** Walk entries under a backing directory. */
      readonly walk: (
        path: t.StringPath,
      ) => t.Awaitable<Iterable<WalkEntry> | AsyncIterable<WalkEntry>>;
    };

    export type Path = {
      readonly Is: PathIs;
      readonly join: (...parts: readonly string[]) => t.StringPath;
      readonly resolve: (...parts: readonly string[]) => t.StringAbsolutePath;
      readonly relative: (from: t.StringPath, to: t.StringPath) => t.StringRelativePath;
      readonly normalize: (path: t.StringPath) => t.StringPath;
    };

    export type PathIs = {
      readonly absolute: (path: t.StringPath) => boolean;
    };

    export type Stat = {
      readonly kind?: t.Files.Entry.Kind;
      readonly isFile?: boolean;
      readonly isDirectory?: boolean;
      readonly isSymlink?: boolean;
      readonly size?: t.NumberBytes;
      readonly modified?: t.StringIsoDate;
      readonly hash?: t.StringHash;
      readonly mediaType?: t.StringMimeType;
    };

    export type WalkEntry = {
      readonly path: t.StringPath;
      readonly kind?: t.Files.Entry.Kind;
      readonly isFile?: boolean;
      readonly isDirectory?: boolean;
      readonly stat?: Stat;
    };
  }

  /** Files/fs error surface. */
  export namespace Error {
    export type Kind = `FilesFsError.${t.Files.Error.KindSuffix}`;
  }
}
