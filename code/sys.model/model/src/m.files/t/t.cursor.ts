/**
 * Cursor contracts for paged Files command surfaces.
 */
export declare namespace FilesCursor {
  /** Cursor codec runtime surface. */
  export type Lib = {
    /** Cursor string prefix. */
    readonly prefix: Prefix;
    /** Cursor format version. */
    readonly version: Version;
    /** Cursor kind constants. */
    readonly Kind: KindMap;
    /** Cursor type guards. */
    readonly Is: IsLib;
    /** Create an opaque cursor string. */
    readonly create: <K extends Kind>(kind: K, token: Token) => StringCursor<K>;
    /** Parse an opaque cursor string. */
    readonly parse: (input: unknown) => Parsed | undefined;
  };

  /** Opaque, versioned cursor token for paged Files command surfaces. */
  export type StringCursor<
    K extends Kind = Kind,
    V extends Version = Version,
  > = `files:cursor:${K}:${V}:${string}`;

  /** Cursor string prefix. */
  export type Prefix = 'files:cursor';
  /** Cursor format version. */
  export type Version = 'v1';
  /** Cursor scope kind. */
  export type Kind = 'list' | 'watch' | 'manifest';
  /** Cursor payload token. */
  export type Token = string;
  /** List-page cursor. */
  export type List = StringCursor<'list'>;
  /** Watch-resume cursor. */
  export type Watch = StringCursor<'watch'>;
  /** Manifest-page cursor. */
  export type Manifest = StringCursor<'manifest'>;

  /** Cursor kind constants. */
  export type KindMap = {
    /** List cursor kind. */
    readonly list: 'list';
    /** Watch cursor kind. */
    readonly watch: 'watch';
    /** Manifest cursor kind. */
    readonly manifest: 'manifest';
  };

  /** Parsed cursor metadata. */
  export type Parsed = Parsed.List | Parsed.Watch | Parsed.Manifest;

  export namespace Parsed {
    /** Parsed cursor shape. */
    export type Shape<K extends Kind> = {
      /** Cursor prefix. */
      readonly prefix: Prefix;
      /** Cursor kind. */
      readonly kind: K;
      /** Cursor version. */
      readonly version: Version;
      /** Cursor token. */
      readonly token: Token;
      /** Original cursor value. */
      readonly value: StringCursor<K>;
    };

    /** Parsed list cursor. */
    export type List = Shape<'list'>;
    /** Parsed watch cursor. */
    export type Watch = Shape<'watch'>;
    /** Parsed manifest cursor. */
    export type Manifest = Shape<'manifest'>;
  }

  /** Cursor type guard surface. */
  export type IsLib = {
    /** True when input is a Files cursor. */
    readonly cursor: (input: unknown) => input is StringCursor;
    /** True when input is a list cursor. */
    readonly list: (input: unknown) => input is List;
    /** True when input is a watch cursor. */
    readonly watch: (input: unknown) => input is Watch;
    /** True when input is a manifest cursor. */
    readonly manifest: (input: unknown) => input is Manifest;
    /** True when input is a cursor for the given kind. */
    readonly kind: <K extends Kind>(kind: K, input: unknown) => input is StringCursor<K>;
  };
}
