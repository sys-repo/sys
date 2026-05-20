import type { t } from './common.ts';
import type { Backing } from '../m.files/t/t.backing.ts';

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
  export type Readonly = Backing.Runtime<'files/memory:readonly'>;

  /** Options for creating an in-memory Files backing. */
  export type Options =
    & Backing.Options
    & Backing.InlineReadOptions
    & t.FilesSource.TextTree;

  /** Files/memory error surface. */
  export namespace Error {
    export type Kind = `FilesMemoryError.${t.FilesError.KindSuffix}`;
  }
}
