import type { t } from './common.ts';

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
  export type Readonly = {
    readonly kind: 'files/static:dist';
    readonly policy: t.Files.Policy.Shape;
    readonly capabilities: t.Files.Capabilities;
    readonly handlers: t.Files.Cmd.HandlerMap;
  };

  /** Options for creating a static Files backing from dist metadata. */
  export type FromDistOptions = {
    /** Canonical static distribution metadata. */
    readonly dist: t.DistPkg;

    /** Optional static base URL used to produce URL content refs. */
    readonly baseUrl?: t.StringUrl;

    /** Files access policy. Defaults to deny-all. */
    readonly policy?: t.Files.Policy.Shape;

    /** Default page size for list/manifest results. */
    readonly defaultLimit?: t.NumberTotal;
  };

  /** Files/static error surface. */
  export namespace Error {
    export type Kind = `FilesStaticError.${t.Files.Error.KindSuffix}`;
  }
}
