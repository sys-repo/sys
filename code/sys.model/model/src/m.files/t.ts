import type { t } from './common.ts';

/**
 * Bounded, transport-independent Files model and command grammar.
 */
export declare namespace Files {
  /** Namespace-style public runtime surface. */
  export type Lib = {
    /** Files Cmd grammar names and namespace. */
    readonly Cmd: Cmd.Lib;

    /** Cursor codec for paged Files command surfaces. */
    readonly Cursor: Cursor.Lib;

    /** Pure policy helpers for bounded Files views. */
    readonly Policy: Policy.Lib;
  };

  /** Stable client facade type for Files Cmd users. */
  export type Client = Cmd.Client;

  /** Canonical root-relative file path visible inside a bounded Files view. */
  export type StringPath = t.StringRelativePath;

  /** Opaque, versioned cursor token for paged Files command surfaces. */
  export type StringCursor<
    K extends Cursor.Kind = Cursor.Kind,
    V extends Cursor.Version = Cursor.Version,
  > = `files:cursor:${K}:${V}:${string}`;

  /** Cursor kinds are scoped so list/watch/manifest tokens do not accidentally mix. */
  export namespace Cursor {
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

  /** Monotonic sequence number for change hints. */
  export type Seq = t.NumberMonotonic;

  /** Non-negative traversal depth for list/manifest scopes. */
  export type Depth = number;

  /** Page-size limit for paged command surfaces. */
  export type Limit = t.NumberTotal;

  /** Supported inline text encodings for first-land reads. */
  export type Encoding = 'utf8';

  /** Path/name selector. Glob-like; not shell syntax and not content search. */
  export type Match = t.StringGlob | readonly t.StringGlob[];

  /** Transport/backing fidelity class for a Files view. */
  export type Fidelity = 'live' | 'dynamic' | 'snapshot' | 'cache';

  /** File or directory entry visible inside a bounded Files view. */
  export type Entry = Entry.File | Entry.Dir;

  export namespace Entry {
    /** Entry kind discriminant. */
    export type Kind = 'file' | 'dir';

    /** Common entry metadata. */
    export type Base = {
      /** Canonical root-relative path. */
      readonly path: StringPath;

      /** Entry kind. */
      readonly kind: Kind;

      /** Last observed modified time, when known. */
      readonly modified?: t.StringIsoDate;

      /** Content hash or backing digest, when known. */
      readonly hash?: t.StringHash;
    };

    /** File entry metadata. */
    export type File = Base & {
      readonly kind: 'file';

      /** File size in bytes, when known. */
      readonly size?: t.NumberBytes;

      /** Media/content type, when known. */
      readonly mediaType?: t.StringMimeType;
    };

    /** Directory entry metadata. */
    export type Dir = Base & {
      readonly kind: 'dir';
    };
  }

  /** Portable reference to file content outside an inline Cmd result. */
  export type ContentRef = ContentRef.Url | ContentRef.Hash | ContentRef.Ref;

  export namespace ContentRef {
    /** Reference shape. */
    export type Kind = 'url' | 'hash' | 'ref';

    /** Common content-ref metadata. */
    export type Base = {
      /** Canonical root-relative file path represented by this ref. */
      readonly path: StringPath;

      /** Content size in bytes, when known. */
      readonly size?: t.NumberBytes;

      /** Media/content type, when known. */
      readonly mediaType?: t.StringMimeType;

      /** Text encoding when this ref points at textual content. */
      readonly encoding?: Encoding;
    };

    /** Fetchable URL ref, suitable for dynamic/static HTTP projections. */
    export type Url = Base & {
      readonly kind: 'url';
      readonly url: t.StringUrl;
      readonly hash?: t.StringHash;
    };

    /** Hash-addressed ref, suitable for manifests and content-addressed stores. */
    export type Hash = Base & {
      readonly kind: 'hash';
      readonly hash: t.StringHash;
    };

    /** Opaque backing-owned ref; not a host filesystem path. */
    export type Ref = Base & {
      readonly kind: 'ref';
      readonly ref: t.StringRef;
      readonly hash?: t.StringHash;
    };
  }

  /** Read-oriented capability name for a bounded Files view. */
  export type Capability = Capability.Name;

  export namespace Capability {
    export type Name = 'list' | 'stat' | 'read' | 'watch' | 'manifest';
    export type Map = { readonly [K in Name]: boolean };
  }

  /** Capability facts for a bounded Files view. */
  export type Capabilities = Capability.Map & {
    /** Backing/transport fidelity for this view. */
    readonly fidelity?: Fidelity;

    /** Maximum inline read size, when enforced by the backing. */
    readonly maxReadBytes?: t.NumberBytes;

    /** Inline encodings supported by this view. */
    readonly encodings?: readonly Encoding[];
  };

  /** Pure policy model for bounded Files views. */
  export namespace Policy {
    /** Policy document shape. Default posture is deny unless allowed. */
    export type Shape = {
      /** Allow listing matching entries/scopes. */
      readonly list?: Match;

      /** Allow statting matching entries. */
      readonly stat?: Match;

      /** Allow reading matching files. */
      readonly read?: Match;

      /** Allow watching matching entries/scopes. */
      readonly watch?: Match;

      /** Allow producing a manifest for this view. */
      readonly manifest?: boolean;

      /** Deny path/name matches after allow rules. */
      readonly deny?: Match;

      /** Maximum inline read size for this policy. */
      readonly maxReadBytes?: t.NumberBytes;
    };

    /** Options for the readonly policy helper. */
    export type ReadonlyOptions = {
      /** Deny path/name matches after allow rules. */
      readonly deny?: Match;

      /** Override watch allow-list. Use false to disable watch. */
      readonly watch?: Match | false;

      /** Maximum inline read size for this policy. */
      readonly maxReadBytes?: t.NumberBytes;
    };

    /** Pure policy helper surface. */
    export type Lib = {
      /** Build a read-oriented policy from one allow-list. */
      readonly readonly: (allow: Match, options?: ReadonlyOptions) => Shape;
    };
  }

  /** Portable manifest for a bounded Files view. */
  export type Manifest = {
    /** Manifest model version. */
    readonly version: 'sys.files.manifest.v1';

    /** Capability facts for this view. */
    readonly capabilities: Capabilities;

    /** Visible entries. */
    readonly entries: readonly Entry[];

    /** Content refs available for entries, when this is a snapshot/static view. */
    readonly content?: readonly ContentRef[];

    /** Snapshot/build timestamp, when known. */
    readonly generated?: t.StringIsoDate;

    /** Cursor for additional manifest pages, when paged. */
    readonly cursor?: Cursor.Manifest;

    /** True when the manifest is intentionally partial. */
    readonly truncated?: boolean;
  };

  /** Change event hint. List/stat/read remain truth. */
  export type Change = {
    /** Change kind. */
    readonly kind: 'created' | 'modified' | 'deleted';

    /** Changed root-relative path. */
    readonly path: StringPath;

    /** Entry metadata for create/modify hints, when known. */
    readonly entry?: Entry;

    /** Monotonic sequence number, when provided by the backing. */
    readonly seq?: Seq;
  };

  /** Files Cmd grammar. */
  export namespace Cmd {
    /** Cmd namespace used when sharing a generic transport. */
    export type Namespace = 'sys.files';

    /** Runtime command names and namespace. */
    export type Lib = {
      readonly ns: Namespace;
      readonly Name: NameMap;
    };

    /** Command name value object. */
    export type NameMap = {
      readonly capabilities: Name.Capabilities;
      readonly list: Name.List;
      readonly stat: Name.Stat;
      readonly read: Name.Read;
      readonly watch: Name.Watch;
      readonly manifest: Name.Manifest;
    };

    /** Command names. */
    export type Name =
      | Name.Capabilities
      | Name.List
      | Name.Stat
      | Name.Read
      | Name.Watch
      | Name.Manifest;

    export namespace Name {
      export type Capabilities = 'files:capabilities';
      export type List = 'files:list';
      export type Stat = 'files:stat';
      export type Read = 'files:read';
      export type Watch = 'files:watch';
      export type Manifest = 'files:manifest';
    }

    /** Per-command payload map. */
    export type Payload = {
      readonly 'files:capabilities': Capabilities.Payload;
      readonly 'files:list': List.Payload;
      readonly 'files:stat': Stat.Payload;
      readonly 'files:read': Read.Payload;
      readonly 'files:watch': Watch.Payload;
      readonly 'files:manifest': Manifest.Payload;
    };

    /** Per-command result map. */
    export type Result = {
      readonly 'files:capabilities': Capabilities.Result;
      readonly 'files:list': List.Result;
      readonly 'files:stat': Stat.Result;
      readonly 'files:read': Read.Result;
      readonly 'files:watch': Watch.Result;
      readonly 'files:manifest': Manifest.Result;
    };

    /** Per-command streaming event map. */
    export type Event = {
      readonly 'files:capabilities': never;
      readonly 'files:list': never;
      readonly 'files:stat': never;
      readonly 'files:read': never;
      readonly 'files:watch': Change;
      readonly 'files:manifest': never;
    };

    /** Cmd handler map for a Files backing. */
    export type HandlerMap = t.Cmd.Handler.Map<Name, Payload, Result, Event>;

    /** Full Cmd client for the Files grammar. */
    export type Client = t.Cmd.Client.Handle<Name, Payload, Result, Event>;

    /** Unary-only Files Cmd client for transports without streaming fidelity. */
    export type UnaryClient = t.Cmd.Client.Unary<Name, Payload, Result>;

    /** Capabilities command. */
    export namespace Capabilities {
      export type Payload = Record<string, never>;
      export type Result = Files.Capabilities;
    }

    /** List command. */
    export namespace List {
      export type Payload = {
        /** Root-relative directory/scope. Defaults to root. */
        readonly path?: StringPath;

        /** Path/name selection. Glob-like; not shell syntax and not content search. */
        readonly match?: Match;

        /** Omit paths. Applied after policy. */
        readonly exclude?: Match;

        /** Bound traversal. */
        readonly depth?: Depth;

        /** Page size. */
        readonly limit?: Limit;

        /** Page cursor. */
        readonly cursor?: Cursor.List;
      };

      export type Result = {
        readonly entries: readonly Entry[];
        readonly cursor?: Cursor.List;
        readonly truncated?: boolean;
      };
    }

    /** Stat command. */
    export namespace Stat {
      export type Payload = { readonly path: StringPath };
      export type Result = { readonly entry: Entry };
    }

    /** Read command. */
    export namespace Read {
      export type Payload = {
        readonly path: StringPath;
        readonly encoding?: Encoding;
        readonly maxBytes?: t.NumberBytes;
      };

      export type Result = InlineResult | RefResult;

      export type InlineResult = {
        readonly kind: 'inline';
        readonly file: Entry.File;
        readonly encoding: Encoding;
        readonly content: string;
        readonly truncated?: boolean;
      };

      export type RefResult = {
        readonly kind: 'ref';
        readonly file: Entry.File;
        readonly contentRef: ContentRef;
      };
    }

    /** Watch command. */
    export namespace Watch {
      export type Payload = {
        /** Root-relative directory/scope. Defaults to root. */
        readonly path?: StringPath;

        /** Path/name selection. */
        readonly match?: Match;

        /** Omit paths. Applied after policy. */
        readonly exclude?: Match;

        /** Resume after a known sequence, when supported. */
        readonly since?: Seq;
      };

      export type Result = {
        readonly ok: true;
        readonly cursor?: Cursor.Watch;
      };
    }

    /** Manifest command. */
    export namespace Manifest {
      export type Payload = {
        /** Root-relative directory/scope. Defaults to root. */
        readonly path?: StringPath;

        /** Path/name selection. */
        readonly match?: Match;

        /** Omit paths. Applied after policy. */
        readonly exclude?: Match;

        /** Bound traversal. */
        readonly depth?: Depth;

        /** Include content refs when available. */
        readonly content?: boolean;

        /** Page size. */
        readonly limit?: Limit;

        /** Page cursor. */
        readonly cursor?: Cursor.Manifest;
      };

      export type Result = Files.Manifest;
    }
  }
}
