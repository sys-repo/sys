import type { t } from './common.ts';
import type { Files as TFiles } from '../m.files/t.ts';

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
  export type Readonly = TFiles.Backing.Shape<'files/static:dist'>;

  /** Options for creating a static Files backing from dist metadata. */
  export type FromDistOptions = TFiles.Backing.Options & {
    /**
     * Canonical frozen distribution metadata.
     *
     * This is the only production Files seam that accepts `DistPkg`; the static
     * adapter translates it into ordinary Files entries/content refs before any
     * Files command result is emitted.
     */
    readonly dist: t.DistPkg;

    /** Optional static base URL used to produce URL content refs. */
    readonly baseUrl?: t.StringUrl;
  };

  /** Files/static error surface. */
  export namespace Error {
    export type Kind = `FilesStaticError.${TFiles.Backing.ErrorKindSuffix}`;
  }
}
