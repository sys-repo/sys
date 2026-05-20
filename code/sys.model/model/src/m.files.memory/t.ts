import type { t } from './common.ts';
import type { Runtime } from '../m.files/t/t.u.runtime.ts';
import type { Error as TError } from '../m.files/t/t.error.ts';

/**
 * In-memory backing adapters for the Files model.
 */
export declare namespace FilesMemory {
  /** Runtime library surface. */
  export type Lib = {
    /** Create a bounded readonly Files backing from an in-memory source tree. */
    readonly readonly: (options?: Options) => Readonly;
  };

  /** Bounded readonly in-memory Files backing. */
  export type Readonly = Runtime.Shape<'files/memory:readonly'>;

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
