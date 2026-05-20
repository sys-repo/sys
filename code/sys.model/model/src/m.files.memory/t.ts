import type { t } from './common.ts';
import type { Runtime } from '../m.files/t/t.u.runtime.ts';
import type { Error as TError } from '../m.files/t/t.u.error.ts';
import type { Live as TLive } from '../m.files/t/t.u.live.ts';

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
  export type Readonly = Runtime.Shape<'files/memory:readonly'>;

  /** Bounded writable in-memory Files backing. */
  export type Writable = Runtime.Shape<'files/memory:writable'>;

  /** Bounded live in-memory Files backing. */
  export type Live = TLive.Shape<'files/memory:live'>;

  /** Options for creating an in-memory Files backing. */
  export type Options =
    & Runtime.Options
    & Runtime.InlineReadOptions
    & t.FilesSource.TextTree;

  /** Files/memory error surface. */
  export namespace Error {
    export type Kind = `FilesMemoryError.${TError.KindSuffix}`;
  }
}
