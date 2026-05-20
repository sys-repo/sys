import type { t } from './common.ts';
import type { Runtime } from '../m.files/t/t.u.runtime.ts';
import type { Error as TError } from '../m.files/t/t.u.error.ts';

/**
 * Static `dist.json` backing adapter for the Files model.
 */
export declare namespace FilesStatic {
  /** Runtime library surface. */
  export type Lib = {
    /** Create a bounded static Files backing from canonical dist metadata. */
    readonly fromDist: (options: FromDistOptions) => Readonly;
  };

  /** Bounded static Files backing. */
  export type Readonly = Runtime.Shape<'files/static:dist'>;

  /** Options for creating a static Files backing from dist metadata. */
  export type FromDistOptions = Runtime.Options & {
    /** Canonical static distribution metadata. */
    readonly dist: t.DistPkg;

    /** Optional static base URL used to produce URL content refs. */
    readonly baseUrl?: t.StringUrl;
  };

  /** Files/static error surface. */
  export namespace Error {
    export type Kind = `FilesStaticError.${TError.KindSuffix}`;
  }
}
