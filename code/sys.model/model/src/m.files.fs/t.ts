import type { t } from './common.ts';
import type * as Backing from '../m.files/t/t.backing.ts';
import type { Error as TError } from '../m.files/t/t.error.ts';

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
  export type Readonly = Backing.Runtime.Shape<'files/fs:readonly'>;

  /** Options for creating a readonly Files backing. */
  export type ReadonlyOptions =
    & Backing.Runtime.Options
    & Backing.Runtime.InlineReadOptions
    & {
      /** Structural filesystem capability. */
      readonly fs: Capability.Readonly;

      /** Host/backing root. Never exposed through Files results. */
      readonly root: t.StringPath;
    };

  /** Structural capabilities required by the readonly Files backing. */
  export namespace Capability {
    export type Readonly = {
      /** Path namespace operations with the same semantics as the backing. */
      readonly Path: Path;

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
      readonly kind?: t.FilesEntry.Kind;
      readonly isFile?: boolean;
      readonly isDirectory?: boolean;
      readonly isSymlink?: boolean;
      readonly size?: t.NumberBytes;
      readonly modifiedAt?: t.UnixTimestamp;
      readonly hash?: t.StringHash;
      readonly mediaType?: t.StringMimeType;
    };

    export type WalkEntry = {
      readonly path: t.StringPath;
      readonly kind?: t.FilesEntry.Kind;
      readonly isFile?: boolean;
      readonly isDirectory?: boolean;
      readonly stat?: Stat;
    };
  }

  /** Files/fs error surface. */
  export namespace Error {
    export type Kind = `FilesFsError.${TError.KindSuffix}`;
  }
}
