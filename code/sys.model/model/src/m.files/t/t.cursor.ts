/**
 * Cursor contracts for paged Files command surfaces.
 */
export declare namespace FilesCursor {
  /** Opaque, versioned cursor token for paged Files command surfaces. */
  export type StringCursor<
    K extends Kind = Kind,
    V extends Version = Version,
  > = `files:cursor:${K}:${V}:${string}`;

  export type Lib = {
    readonly prefix: Prefix;
    readonly version: Version;
    readonly Kind: KindMap;
    readonly Is: IsLib;
    readonly create: <K extends Kind>(kind: K, token: Token) => StringCursor<K>;
    readonly parse: (input: unknown) => Parsed | undefined;
  };

  export type Prefix = 'files:cursor';
  export type Version = 'v1';
  export type Kind = 'list' | 'watch' | 'manifest';
  export type Token = string;
  export type List = StringCursor<'list'>;
  export type Watch = StringCursor<'watch'>;
  export type Manifest = StringCursor<'manifest'>;

  export type KindMap = {
    readonly list: 'list';
    readonly watch: 'watch';
    readonly manifest: 'manifest';
  };

  export type Parsed = Parsed.List | Parsed.Watch | Parsed.Manifest;

  export namespace Parsed {
    export type Shape<K extends Kind> = {
      readonly prefix: Prefix;
      readonly kind: K;
      readonly version: Version;
      readonly token: Token;
      readonly value: StringCursor<K>;
    };

    export type List = Shape<'list'>;
    export type Watch = Shape<'watch'>;
    export type Manifest = Shape<'manifest'>;
  }

  export type IsLib = {
    readonly cursor: (input: unknown) => input is StringCursor;
    readonly list: (input: unknown) => input is List;
    readonly watch: (input: unknown) => input is Watch;
    readonly manifest: (input: unknown) => input is Manifest;
    readonly kind: <K extends Kind>(kind: K, input: unknown) => input is StringCursor<K>;
  };
}
