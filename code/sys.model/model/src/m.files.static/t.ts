/**
 * @module
 * Static dist-backed Files model type surface.
 */
import type { t } from './common.ts';
import type { Files } from '../m.files/t.ts';

/**
 * Static `dist.json` backing adapter for the Files model.
 */
export declare namespace FilesStatic {
  /** Runtime library surface. */
  export type Lib = {
    /** Create a bounded static Files backing from canonical dist metadata. */
    readonly fromDist: FromDist;
  };

  /** Create a bounded static Files backing from canonical dist metadata. */
  export type FromDist = (options: FromDistOptions) => Readonly;

  /** Bounded static Files backing. */
  export type Readonly = Files.Backing.Shape<'files/static:dist'>;

  /** Options for creating a static Files backing from dist metadata. */
  export type FromDistOptions = Files.Backing.Options & {
    /**
     * Canonical distribution metadata consumed as deeply readonly.
     *
     * This is the only production Files seam that accepts `DistPkg`; the static
     * adapter translates it into ordinary Files entries/content refs before any
     * Files command result is emitted.
     */
    readonly dist: t.DeepReadonly<t.DistPkg>;

    /** Optional static base URL used to produce URL content refs. */
    readonly baseUrl?: t.StringUrl;
  };

  /** Files/static error surface. */
  export namespace Error {
    export type Kind = `FilesStaticError.${Files.Backing.ErrorKindSuffix}`;
  }
}
