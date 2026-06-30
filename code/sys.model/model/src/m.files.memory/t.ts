/**
 * @module
 * In-memory Files model type surface.
 */
import type { t } from './common.ts';
import type { Files as TFiles } from '../m.files/t.ts';

/**
 * In-memory backing adapters for the Files model.
 */
export declare namespace FilesMemory {
  /** Runtime library surface. */
  export type Lib = {
    /** Readonly in-memory Files backing constructors. */
    readonly Readonly: ReadonlyLib;

    /** Writable in-memory Files backing constructors. */
    readonly Writable: WritableLib;
  };

  /** Readonly in-memory Files backing constructors. */
  export type ReadonlyLib = {
    /** Create a bounded readonly Files backing from an in-memory source tree. */
    readonly create: (options?: Options) => Readonly;
  };

  /** Writable in-memory Files backing constructors. */
  export type WritableLib = {
    /** Create a bounded writable Files backing from an in-memory source tree. */
    readonly create: (options?: Options) => Writable;

    /** Create a bounded live Files backing from an in-memory source tree. */
    readonly live: (options?: Options) => Live;
  };

  /** Bounded readonly in-memory Files backing. */
  export type Readonly = TFiles.Backing.Shape<'files/memory:readonly'>;

  /** Bounded writable in-memory Files backing. */
  export type Writable = TFiles.Backing.Shape<'files/memory:writable'>;

  /** Bounded live in-memory Files backing. */
  export type Live = TFiles.Live.Shape<'files/memory:live'>;

  /** Options for creating an in-memory Files backing. */
  export type Options =
    & TFiles.Backing.Options
    & TFiles.Backing.InlineReadOptions
    & TFiles.Backing.InlineWriteOptions
    & t.Files.Source.TextTree;

  /** Files/memory error surface. */
  export namespace Error {
    export type Kind = `FilesMemoryError.${TFiles.Backing.ErrorKindSuffix}`;
  }
}
