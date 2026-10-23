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
    /** Create a static Files backing from a supported content inventory. */
    readonly fromDist: FromDist;
  };

  /** Index content facts; this adapter does not authenticate a pin or read payload bytes. */
  export type FromDist = (options: FromDistOptions) => Readonly;

  /** Bounded static Files backing. */
  export type Readonly = Files.Backing.Shape<'files/static:dist'>;

  /** Options for indexing content facts and separately supplied observations. */
  export type FromDistOptions = Files.Backing.Options & {
    /** Supported content inventory, translated into ordinary Files entries and refs. */
    dist: t.DeepReadonly<t.DistContent>;

    /** Optional descriptive observation; never authenticated by the content identity. */
    buildTime?: t.UnixTimestamp;

    /** Optional static base URL used to produce URL content refs. */
    baseUrl?: t.StringUrl;
  };

  /** Files/static error surface. */
  export namespace Error {
    export type Kind = `FilesStaticError.${Files.Backing.ErrorKindSuffix}`;
  }
}
