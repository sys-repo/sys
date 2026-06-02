import type { t } from './common.ts';

/**
 * Bounded Files model, command grammar, content refs, and typed client adapters.
 */
export declare namespace Files {
  /**
   * Type-spine note:
   *
   * This namespace is intentionally kept as one monolithic contract file.
   * Earlier split-out `t/*` subfiles made the public surface easier to misuse:
   * sub-namespaces that were not exported from `Files` became tempting direct
   * imports, and human/agent callers propagated those private seams instead of
   * using the single `Files` contract.
   *
   * Keeping the contract here forces consumers through the one public namespace
   * and keeps nested shapes scanable in context. The file is larger, but the
   * boundary is clearer; that is the lesser coupling.
   */

  /** Namespace-style public runtime surface. */
  export type Lib = {
    /** Files authority resolver. */
    readonly Authority: Authority.Lib;
    /** Files Cmd grammar names and namespace. */
    readonly Cmd: Cmd.Lib;
    /** Canonical Files capability names. */
    readonly Capability: Capability.Lib;
    /** Typed client adapters for Files command surfaces. */
    readonly Client: Client.Lib;
    /** Files-domain content-reference resolvers. */
    readonly ContentRef: ContentRef.Lib;
    /** Cursor codec for paged Files command surfaces. */
    readonly Cursor: Cursor.Lib;
    /** Pure policy helpers for bounded Files views. */
    readonly Policy: Policy.Lib;
  };

  /**
   * Structural backing surfaces shared by Files adapters.
   */
  export namespace Backing {
    /** Minimal Cmd surface exposed by a bounded Files backing. */
    export type CmdSurface<K extends string = string> = {
      /** Backing kind, when surfaced as owner-local metadata. */
      readonly kind?: K;
      /** Capability facts for the bounded Files view. */
      readonly capabilities: Capabilities;
      /** Canonical Files Cmd handlers. */
      readonly handlers: Cmd.HandlerMap;
    };

    /** Runtime shape shared by model-owned Files backing adapters. */
    export type Shape<K extends string> = CmdSurface<K> & {
      /** Backing kind, surfaced only as owner-local metadata. */
      readonly kind: K;
      /** Snapshotted Files access policy used by this backing. */
      readonly policy: Policy.Shape;
    };

    /** Shared options for bounded Files backing creation. */
    export type Options = {
      /** Files access policy; defaults to deny-all. */
      readonly policy?: Policy.Shape;
      /** Default page size for list/manifest results. */
      readonly defaultLimit?: t.NumberTotal;
    };

    /** Shared options for backings that can return inline text. */
    export type InlineReadOptions = {
      /** Maximum bytes returned by `files:read`. */
      readonly maxReadBytes?: t.NumberBytes;
    };

    /** Shared options for backings that can write complete file values. */
    export type InlineWriteOptions = {
      /** Maximum bytes accepted by `files:write`. */
      readonly maxWriteBytes?: t.NumberBytes;
    };

    /** Canonical suffixes used by Files backing-specific error names. */
    export type ErrorKindSuffix =
      | 'InvalidPath'
      | 'PathOutsideRoot'
      | 'NotFound'
      | 'NotFile'
      | 'NotDirectory'
      | 'DirectoryNotEmpty'
      | 'PolicyDenied'
      | 'ReadTooLarge'
      | 'WriteTooLarge'
      | 'PartialFailure'
      | 'Unsupported';
  }

  /**
   * Live Files backing surfaces.
   */
  export namespace Live {
    /** Runtime shape shared by live Files backing adapters. */
    export type Shape<K extends string> = Backing.Shape<K> & {
      /** Read-only live backing diagnostics; not Files authority. */
      readonly diagnostics: Diagnostics;
    };

    /** Read-only diagnostics for deterministic live backing orchestration/tests. */
    export type Diagnostics = {
      /** Diagnostics for active live subscriptions. */
      readonly Active: ActiveDiagnostics;
    };

    /** Diagnostics for active live subscriptions. */
    export type ActiveDiagnostics = {
      /** Number of currently active `files:watch` subscriptions. */
      readonly watchCount: () => number;

      /** Resolve when at least one `files:watch` subscription is active. */
      readonly whenActive: () => Promise<void>;
    };
  }

  /**
   * Files string-shaped scalar contracts.
   */
  export namespace String {
    /** Canonical root-relative file path visible inside a bounded Files view. */
    export type Path = t.StringRelativePath;

    /** Opaque, versioned cursor token for paged Files command surfaces. */
    export type Cursor<
      K extends Files.Cursor.Kind = Files.Cursor.Kind,
      V extends Files.Cursor.Version = Files.Cursor.Version,
    > = Files.Cursor.StringCursor<K, V>;
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

  /**
   * Capability facts for bounded Files views.
   */
  export namespace Capability {
    /** Runtime capability constants. */
    export type Lib = { readonly names: Names };

    /** Canonical ordered Files capability names. */
    export type Names = readonly ['list', 'stat', 'read', 'write', 'remove', 'watch', 'manifest'];

    /** Files capability name. */
    export type Name = Names[number];

    /** Boolean capability map. */
    export type Map = { readonly [K in Name]: boolean };

    /** Capability facts for a bounded Files view. */
    export type Capabilities = Map & {
      /** Backing/transport fidelity for this view. */
      readonly fidelity?: Fidelity;
      /** Maximum inline read size, when enforced by the backing. */
      readonly maxReadBytes?: t.NumberBytes;
      /** Maximum write payload size, when enforced by the backing. */
      readonly maxWriteBytes?: t.NumberBytes;
      /** Inline encodings supported by this view. */
      readonly encodings?: readonly Encoding[];
    };
  }

  /** Capability name for a bounded Files view. */
  export type Capability = Capability.Name;

  /** Boolean capability map. */
  export type CapabilityMap = Capability.Map;

  /** Capability facts for a bounded Files view. */
  export type Capabilities = Capability.Capabilities;

  /**
   * Entry metadata visible inside a bounded Files view.
   */
  export namespace Entry {
    /** File or directory entry visible inside a bounded Files view. */
    export type Entry = File | Dir;

    /** Entry kind discriminant. */
    export type Kind = 'file' | 'dir';

    /** Common entry metadata. */
    export type Base = {
      /** Canonical root-relative path. */
      readonly path: String.Path;
      /** Entry kind. */
      readonly kind: Kind;
      /** Last observed modified time, Unix epoch milliseconds, when known. */
      readonly modifiedAt?: t.UnixTimestamp;
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
    export type Dir = Base & { readonly kind: 'dir' };
  }

  /** File or directory entry visible inside a bounded Files view. */
  export type Entry = Entry.Entry;

  /** File entry metadata. */
  export type File = Entry.File;

  /** Directory entry metadata. */
  export type Dir = Entry.Dir;

  /**
   * Portable references to file content outside inline Cmd results.
   */
  export namespace ContentRef {
    /** Files-domain content-reference resolver surface. */
    export type Lib = {
      /** Resolve a Files content reference to bytes. */
      readonly bytes: (ref: ContentRef, options?: Options) => Promise<Uint8Array>;
      /** Resolve a Files content reference to UTF-8 text. */
      readonly text: (ref: ContentRef, options?: TextOptions) => Promise<string>;
    };

    /** Options for resolving Files content references. */
    export type Options = {
      /** Fetch implementation; defaults to the global Web Fetch API when available. */
      readonly fetch?: t.Fetch;
      /** Abort signal passed to the underlying content fetch. */
      readonly signal?: AbortSignal;
      /** Lifecycle input that aborts the underlying content fetch when disposed. */
      readonly until?: t.UntilInput;
      /** Integrity checks; defaults to verifying size and hash metadata when present. */
      readonly verify?: boolean | VerifyOptions;
    };

    /** Options for resolving Files content references as text. */
    export type TextOptions = Options & {
      /** Text encoding; defaults to the ref encoding, then `utf8`. */
      readonly encoding?: Encoding;
    };

    /** Integrity verification switches for metadata carried by a content ref. */
    export type VerifyOptions = {
      /** Verify `ContentRef.size` when present. */
      readonly size?: boolean;
      /** Verify `ContentRef.hash` when present. */
      readonly hash?: boolean;
    };

    /** Files content-ref resolver error names. */
    export namespace Error {
      /** Files content-ref resolver error name. */
      export type Kind =
        | 'FilesContentRefError.Unsupported'
        | 'FilesContentRefError.FetchUnavailable'
        | 'FilesContentRefError.FetchFailed'
        | 'FilesContentRefError.HttpFailure'
        | 'FilesContentRefError.SizeMismatch'
        | 'FilesContentRefError.HashMismatch'
        | 'FilesContentRefError.HashUnsupported'
        | 'FilesContentRefError.UnsupportedEncoding'
        | 'FilesContentRefError.DecodeFailed';
    }

    /** Portable reference to file content outside an inline Cmd result. */
    export type ContentRef = Url | Hash | Ref;

    /** Reference shape. */
    export type Kind = 'url' | 'hash' | 'ref';

    /** Common content-ref metadata. */
    export type Base = {
      /** Canonical root-relative file path represented by this ref. */
      readonly path: String.Path;
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

  /** Portable reference to file content outside an inline Cmd result. */
  export type ContentRef = ContentRef.ContentRef;

  /**
   * Files change hints. List/stat/read remain truth.
   */
  export namespace Change {
    /** Source of a change hint. */
    export type Origin = 'command' | 'fs-watch';

    /** Change event hint. List/stat/read remain truth. */
    export type Change = {
      /** Change kind. */
      readonly kind: 'created' | 'modified' | 'deleted';
      /** Changed root-relative path. */
      readonly path: String.Path;
      /** Entry metadata for create/modify hints, when known. */
      readonly entry?: Entry;
      /** Monotonic sequence number, when provided by the backing. */
      readonly seq?: Seq;
      /** Change hint origin, when provided by the backing. */
      readonly origin?: Origin;
      /** Request/correlation id for command-origin hints, when provided. */
      readonly correlation?: t.Cmd.ReqId;
    };
  }

  /** Change event hint; list/stat/read remain truth. */
  export type Change = Change.Change;

  /**
   * Cursor contracts for paged Files command surfaces.
   */
  export namespace Cursor {
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

    /**
     * Parsed cursor variants.
     */
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

  /**
   * Portable runtime manifest for a bounded Files view.
   *
   * Frozen distribution/package metadata is translated through the static Files
   * adapter before command handlers emit this shape; manifest results must stay
   * on the Files runtime contract.
   */
  export type Manifest = {
    /** Manifest control/provenance metadata. */
    readonly '.meta': ManifestMeta;
    /** Visible entries. */
    readonly entries: readonly Entry[];
    /** Content refs available for entries, when requested and available. */
    readonly contentRefs?: readonly ContentRef[];
  };

  /** Manifest model version. */
  export type ManifestVersion = 'sys.files.manifest:v1';

  /** Manifest control/provenance metadata. */
  export type ManifestMeta = {
    /** Manifest model version. */
    readonly version: ManifestVersion;
    /** Capability facts for this view. */
    readonly capabilities: Capabilities;
    /** Static distribution provenance, when known. */
    readonly dist?: ManifestDistMeta;
    /** Page facts, when additional data is available. */
    readonly page?: ManifestPageMeta;
  };

  /** Static distribution provenance attached to a manifest. */
  export type ManifestDistMeta = {
    /** Static distribution build metadata, matching dist.json shape where it overlaps. */
    readonly build: {
      /** Timestamp of dist build. */
      readonly time: t.UnixTimestamp;
    };
  };

  /** Manifest paging metadata. */
  export type ManifestPageMeta = {
    /** Cursor for additional manifest pages, when paged. */
    readonly cursor?: Cursor.Manifest;
    /** True when the manifest is intentionally partial. */
    readonly truncated?: boolean;
  };

  /**
   * Pure policy model for bounded Files views.
   */
  export namespace Policy {
    /** Pure policy helper surface. */
    export type Lib = {
      /** Build a read-oriented policy from one allow-list. */
      readonly readonly: (allow: Match, options?: ReadonlyOptions) => Shape;
    };

    /** Policy document shape. Default posture is deny unless allowed. */
    export type Shape = {
      /** Allow listing matching entries/scopes. */
      readonly list?: Match;
      /** Allow statting matching entries. */
      readonly stat?: Match;
      /** Allow reading matching files. */
      readonly read?: Match;
      /** Allow writing matching files. */
      readonly write?: Match;
      /** Allow removing matching entries. */
      readonly remove?: Match;
      /** Allow watching matching entries/scopes. */
      readonly watch?: Match;
      /** Allow producing a manifest for this view. */
      readonly manifest?: boolean;
      /** Deny path/name matches after allow rules. */
      readonly deny?: Match;
      /** Maximum inline read size for this policy. */
      readonly maxReadBytes?: t.NumberBytes;
      /** Maximum write payload size for this policy. */
      readonly maxWriteBytes?: t.NumberBytes;
    };

    /** Options for the readonly policy helper. */
    export type ReadonlyOptions = {
      /** Deny path/name matches after allow rules. */
      readonly deny?: Match;
      /** Override watch allow-list; false disables watch. */
      readonly watch?: Match | false;
      /** Maximum inline read size for this policy. */
      readonly maxReadBytes?: t.NumberBytes;
    };
  }

  /**
   * Files Cmd grammar.
   */
  export namespace Cmd {
    /** Runtime command names and namespace. */
    export type Lib = {
      /** Cmd namespace used when sharing a generic transport. */
      readonly ns: Namespace;
      /** Runtime command names. */
      readonly Name: NameMap;
      /** Create a typed Cmd<T> factory bound to the Files grammar. */
      readonly make: MakeFactory;
    };

    /** Cmd namespace used when sharing a generic transport. */
    export type Namespace = 'sys.files';

    /** Typed Cmd<T> factory bound to the Files grammar. */
    export type Factory = t.Cmd.Factory<Name, Payload, Result, Event>;

    /** Factory constructor for the typed Files Cmd<T> grammar. */
    export type MakeFactory = () => Factory;

    /** Command name value object. */
    export type NameMap = {
      /** Capabilities command name. */
      readonly capabilities: Name.Capabilities;
      /** List command name. */
      readonly list: Name.List;
      /** Stat command name. */
      readonly stat: Name.Stat;
      /** Read command name. */
      readonly read: Name.Read;
      /** Write command name. */
      readonly write: Name.Write;
      /** Remove command name. */
      readonly remove: Name.Remove;
      /** Watch command name. */
      readonly watch: Name.Watch;
      /** Manifest command name. */
      readonly manifest: Name.Manifest;
    };

    /** Command names. */
    export type Name =
      | Name.Capabilities
      | Name.List
      | Name.Stat
      | Name.Read
      | Name.Write
      | Name.Remove
      | Name.Watch
      | Name.Manifest;

    /**
     * Command name literal contracts.
     */
    export namespace Name {
      /** Capabilities command name. */
      export type Capabilities = 'files:capabilities';
      /** List command name. */
      export type List = 'files:list';
      /** Stat command name. */
      export type Stat = 'files:stat';
      /** Read command name. */
      export type Read = 'files:read';
      /** Write command name. */
      export type Write = 'files:write';
      /** Remove command name. */
      export type Remove = 'files:remove';
      /** Watch command name. */
      export type Watch = 'files:watch';
      /** Manifest command name. */
      export type Manifest = 'files:manifest';
    }

    /** Per-command payload map. */
    export type Payload = {
      /** Capabilities payload. */
      readonly 'files:capabilities': Capabilities.Payload;
      /** List payload. */
      readonly 'files:list': List.Payload;
      /** Stat payload. */
      readonly 'files:stat': Stat.Payload;
      /** Read payload. */
      readonly 'files:read': Read.Payload;
      /** Write payload. */
      readonly 'files:write': Write.Payload;
      /** Remove payload. */
      readonly 'files:remove': Remove.Payload;
      /** Watch payload. */
      readonly 'files:watch': Watch.Payload;
      /** Manifest payload. */
      readonly 'files:manifest': Manifest.Payload;
    };

    /** Per-command result map. */
    export type Result = {
      /** Capabilities result. */
      readonly 'files:capabilities': Capabilities.Result;
      /** List result. */
      readonly 'files:list': List.Result;
      /** Stat result. */
      readonly 'files:stat': Stat.Result;
      /** Read result. */
      readonly 'files:read': Read.Result;
      /** Write result. */
      readonly 'files:write': Write.Result;
      /** Remove result. */
      readonly 'files:remove': Remove.Result;
      /** Watch result. */
      readonly 'files:watch': Watch.Result;
      /** Manifest result. */
      readonly 'files:manifest': Manifest.Result;
    };

    /** Per-command streaming event map. */
    export type Event = {
      /** Capabilities events. */
      readonly 'files:capabilities': never;
      /** List events. */
      readonly 'files:list': never;
      /** Stat events. */
      readonly 'files:stat': never;
      /** Read events. */
      readonly 'files:read': never;
      /** Write events. */
      readonly 'files:write': never;
      /** Remove events. */
      readonly 'files:remove': never;
      /** Watch events. */
      readonly 'files:watch': Change;
      /** Manifest events. */
      readonly 'files:manifest': never;
    };

    /** Cmd handler map for a Files backing. */
    export type HandlerMap = t.Cmd.Handler.Map<Name, Payload, Result, Event>;

    /** Full Cmd client for the Files grammar. */
    export type Client = t.Cmd.Client.Handle<Name, Payload, Result, Event>;

    /** Unary-only Files Cmd client for transports without streaming fidelity. */
    export type UnaryClient = t.Cmd.Client.Unary<Name, Payload, Result>;

    /**
     * Capabilities command.
     */
    export namespace Capabilities {
      /** Capabilities request payload. */
      export type Payload = Record<string, never>;
      /** Capability facts for the bounded Files view. */
      export type Result = Files.Capabilities;
    }

    /**
     * List command.
     */
    export namespace List {
      /** List request payload. */
      export type Payload = {
        /** Root-relative directory/scope; defaults to root. */
        readonly path?: String.Path;
        /** Path/name selection; glob-like, not shell syntax. */
        readonly match?: Match;
        /** Omit paths after policy filtering. */
        readonly exclude?: Match;
        /** Traversal depth bound. */
        readonly depth?: Depth;
        /** Page size. */
        readonly limit?: Limit;
        /** Page cursor. */
        readonly cursor?: Cursor.List;
      };

      /** List result. */
      export type Result = {
        /** Visible entries. */
        readonly entries: readonly Entry[];
        /** Cursor for additional list pages. */
        readonly cursor?: Cursor.List;
        /** True when the result is intentionally partial. */
        readonly truncated?: boolean;
      };
    }

    /**
     * Stat command.
     */
    export namespace Stat {
      /** Stat request payload. */
      export type Payload = { readonly path: String.Path };
      /** Stat result. */
      export type Result = { readonly entry: Entry };
    }

    /**
     * Read command.
     */
    export namespace Read {
      /** Read request payload. */
      export type Payload = {
        /** Root-relative file path. */
        readonly path: String.Path;
        /** Requested text encoding. */
        readonly encoding?: Encoding;
        /** Caller-requested maximum bytes. */
        readonly maxBytes?: t.NumberBytes;
      };

      /** Read result. */
      export type Result = InlineResult | RefResult;

      /** Inline text read result. */
      export type InlineResult = {
        /** Result kind. */
        readonly kind: 'inline';
        /** File metadata. */
        readonly file: File;
        /** Text encoding. */
        readonly encoding: Encoding;
        /** Inline file content. */
        readonly content: string;
        /** True when content is intentionally partial. */
        readonly truncated?: boolean;
      };

      /** Content-reference read result. */
      export type RefResult = {
        /** Result kind. */
        readonly kind: 'ref';
        /** File metadata. */
        readonly file: File;
        /** Portable content reference. */
        readonly contentRef: ContentRef;
      };
    }

    /**
     * Write command.
     */
    export namespace Write {
      /** Write request payload. */
      export type Payload = TextPayload | BytesPayload;

      /** Complete text-file value write. Not a patch/edit operation. */
      export type TextPayload = {
        /** Write payload kind. */
        readonly kind: 'text';
        /** Root-relative file path. */
        readonly path: String.Path;
        /** Complete text content to write. */
        readonly content: string;
        /** Text encoding. */
        readonly encoding?: Encoding;
        /** Media/content type, when known by the caller. */
        readonly mediaType?: t.StringMimeType;
      };

      /** Complete binary-file value write. Not a JSON transport shape. */
      export type BytesPayload = {
        /** Write payload kind. */
        readonly kind: 'bytes';
        /** Root-relative file path. */
        readonly path: String.Path;
        /** Complete binary content to write. */
        readonly content: Uint8Array;
        /** Media/content type, when known by the caller. */
        readonly mediaType?: t.StringMimeType;
      };

      /** Write result. */
      export type Result = {
        /** Change kind produced by the write. */
        readonly kind: 'created' | 'modified';
        /** Root-relative file path written. */
        readonly path: String.Path;
        /** File metadata, when returned by the backing. */
        readonly entry?: File;
        /** Monotonic sequence number, when provided by the backing. */
        readonly seq?: Seq;
        /** Request/correlation id for command-origin changes, when provided. */
        readonly correlation?: t.Cmd.ReqId;
      };
    }

    /**
     * Remove command.
     */
    export namespace Remove {
      /** Remove request payload. */
      export type Payload = {
        /** Root-relative file or directory path. */
        readonly path: String.Path;
        /** Allow recursive directory removal. */
        readonly recursive?: boolean;
      };

      /** Remove result. */
      export type Result = {
        /** Change kind produced by the remove. */
        readonly kind: 'deleted';
        /** Root-relative path removed. */
        readonly path: String.Path;
        /** Monotonic sequence number, when provided by the backing. */
        readonly seq?: Seq;
        /** Request/correlation id for command-origin changes, when provided. */
        readonly correlation?: t.Cmd.ReqId;
      };
    }

    /**
     * Watch command.
     */
    export namespace Watch {
      /** Watch request payload. */
      export type Payload = {
        /** Root-relative directory/scope; defaults to root. */
        readonly path?: String.Path;
        /** Path/name selection. */
        readonly match?: Match;
        /** Omit paths after policy filtering. */
        readonly exclude?: Match;
        /** Resume after a known sequence, when supported. */
        readonly since?: Seq;
      };

      /** Watch result. */
      export type Result = {
        /** True when the watch subscription ended cleanly. */
        readonly ok: true;
        /** Cursor for resuming from the last observed change. */
        readonly cursor?: Cursor.Watch;
      };
    }

    /**
     * Manifest command.
     */
    export namespace Manifest {
      /** Manifest request payload. */
      export type Payload = {
        /** Root-relative directory/scope; defaults to root. */
        readonly path?: String.Path;
        /** Path/name selection. */
        readonly match?: Match;
        /** Omit paths after policy filtering. */
        readonly exclude?: Match;
        /** Traversal depth bound. */
        readonly depth?: Depth;
        /** Include portable content refs when available; never inline content. */
        readonly contentRefs?: boolean;
        /** Page size. */
        readonly limit?: Limit;
        /** Page cursor. */
        readonly cursor?: Cursor.Manifest;
      };

      /** Manifest result. */
      export type Result = Files.Manifest;
    }
  }

  /**
   * Files client adapters.
   */
  export namespace Client {
    /** Runtime client adapter surface. */
    export type Lib = {
      /** Bind an in-process Files backing and return a Files client handle. */
      local(backing: Backing.CmdSurface, options?: LocalOptions): Local;
      /** Bind a generic Cmd endpoint and return a Files client handle. */
      transport(endpoint: t.Cmd.Endpoint, options?: TransportOptions): Transport;
      /** Open a WebSocket and return a Files client handle bound to it. */
      websocket(url: t.StringUrl | URL, options?: WebSocketOptions): Promise<WebSocket>;
    };

    /** Client-facing Files handle backed by the raw Cmd escape hatch. */
    export type Handle = t.Lifecycle & {
      /** Raw typed Cmd client for structured/advanced Files command access. */
      readonly cmd: Cmd.Client;
      /** Get capability facts for the bounded Files view. */
      capabilities(): Promise<Capabilities>;
      /** Query visible entries without manifest metadata. */
      list(input?: ListOptions): Promise<Cmd.List.Result>;
      /** Query one visible entry and return the entry directly. */
      stat(path: String.Path): Promise<Entry>;
      /** Produce a runtime manifest without optional content refs. */
      manifest(): Promise<Files.Manifest>;
      /** Produce a runtime manifest with a present contentRefs array. */
      manifest(options: ManifestWithContentRefsOptions): Promise<ManifestWithContentRefs>;
      /** Produce a runtime manifest for the bounded Files view. */
      manifest(options?: ManifestOptions): Promise<Files.Manifest>;
      /** Read a text file as a string through the typed `files:read` command. */
      readText(path: String.Path, options?: Read.TextOptions): Promise<string>;
      /**
       * Write a complete text-file value through the typed `files:write` command.
       */
      writeText(
        path: String.Path,
        content: string,
        options?: Write.TextOptions,
      ): Promise<Cmd.Write.Result>;
      /**
       * Write a complete byte-file value through the typed `files:write` command.
       */
      writeBytes(
        path: String.Path,
        content: Uint8Array,
        options?: Write.BytesOptions,
      ): Promise<Cmd.Write.Result>;
      /**
       * Remove a file or directory through the typed `files:remove` command.
       */
      remove(path: String.Path, options?: Remove.Options): Promise<Cmd.Remove.Result>;
      /** Watch for change hints and return the typed Cmd stream handle. */
      watch(input?: WatchOptions): Watch;
    };

    /** Files client handle backed by an in-process Files backing. */
    export type Local = Handle;

    /** Files client handle backed by a generic Cmd endpoint. */
    export type Transport = Handle;

    /** Files client handle backed by a WebSocket transport. */
    export type WebSocket = Handle & t.WaitableHandle & {
      /** Concrete URL used to open the socket. */
      readonly url: t.StringUrl;
      /** Resolves when the underlying WebSocket closes; the client lifecycle disposes with it. */
      readonly finished: Promise<CloseEvent | undefined>;
      /** Dispose the client and await WebSocket close. */
      close(reason?: unknown): Promise<void>;
    };

    /** Options for `Files.Client.list(...)`. */
    export type ListOptions = Cmd.List.Payload;

    /** Options for `Files.Client.manifest(...)`. */
    export type ManifestOptions = Cmd.Manifest.Payload;

    /** Manifest result with content refs present because the caller requested them. */
    export type ManifestWithContentRefs = Omit<Files.Manifest, 'contentRefs'> & {
      /** Portable content refs available for entries; never inline content. */
      readonly contentRefs: readonly ContentRef[];
    };

    /** Options for `Files.Client.manifest(...)` that request content refs. */
    export type ManifestWithContentRefsOptions = ManifestOptions & {
      /** Include portable content refs when available; never inline content. */
      readonly contentRefs: true;
    };

    /**
     * Client read method types.
     */
    export namespace Read {
      /** Options for `Files.Client.readText(...)`. */
      export type TextOptions = Omit<Cmd.Read.Payload, 'path'>;
    }

    /**
     * Client write method types.
     */
    export namespace Write {
      /** Options for `Files.Client.writeText(...)`. */
      export type TextOptions = Omit<Cmd.Write.TextPayload, 'kind' | 'path' | 'content'>;

      /** Options for `Files.Client.writeBytes(...)`. */
      export type BytesOptions = Omit<Cmd.Write.BytesPayload, 'kind' | 'path' | 'content'>;
    }

    /**
     * Client remove method types.
     */
    export namespace Remove {
      /** Options for `Files.Client.remove(...)`. */
      export type Options = Omit<Cmd.Remove.Payload, 'path'>;
    }

    /** Options for `Files.Client.watch(...)`. */
    export type WatchOptions = Cmd.Watch.Payload;

    /** Typed watch stream returned by `Files.Client.watch(...)`. */
    export type Watch = t.Cmd.Stream.Handle<Cmd.Name, Cmd.Result, Cmd.Event, Cmd.Name.Watch>;

    /** Options for `Files.Client.local(...)`. */
    export type LocalOptions = Pick<t.Cmd.Client.Options, 'timeout'>;

    /** Options for `Files.Client.transport(...)`. */
    export type TransportOptions = Pick<t.Cmd.Client.Options, 'timeout' | 'closeEndpoint'>;

    /** Options for `Files.Client.websocket(...)`. */
    export type WebSocketOptions = Pick<t.Cmd.Client.Options, 'timeout'> & {
      /** Optional WebSocket subprotocols passed to the platform constructor. */
      readonly protocols?: string | string[];
    };
  }

  /**
   * Resolved Files authority.
   */
  export namespace Authority {
    /** Runtime helper surface. */
    export type Lib = {
      /** Resolve a policy and backing support facts into one authority value. */
      readonly resolve: (input: ResolveInput) => Instance;
    };

    /** Inputs for resolving Files authority. */
    export type ResolveInput = {
      /** Human-authored Files policy; defaults to deny-all. */
      readonly policy?: Policy.Shape;
      /** Backing support facts. */
      readonly backing: BackingFacts;
      /** Error factories used by generated checks and handler gates. */
      readonly errors?: ErrorFactories;
    };

    /** Backing support facts that authority projects into capabilities. */
    export type BackingFacts = {
      /** Commands/features the backing can support before policy is applied. */
      readonly supports: Partial<Capability.Map>;
      /** Backing/transport fidelity for this view. */
      readonly fidelity?: Fidelity;
      /** Backing-level maximum inline read size. */
      readonly maxReadBytes?: t.NumberBytes;
      /** Backing-level maximum write payload size. */
      readonly maxWriteBytes?: t.NumberBytes;
      /** Inline encodings supported by this backing. */
      readonly encodings?: readonly Encoding[];
    };

    /** Resolved runtime authority. */
    export type Instance = {
      /** Snapshotted policy used by this authority. */
      readonly policy: Policy.Shape;
      /** Normalized backing support facts. */
      readonly supports: Capability.Map;
      /** Capability projection derived from backing facts and policy. */
      readonly capabilities: Capabilities;
      /** True when the action is backed and policy grants the path/scope. */
      readonly allows: (action: Action, path?: String.Path) => boolean;
      /** Throw when the action is unsupported or denied for the path/scope. */
      readonly check: (action: Action, path?: String.Path) => void;
      /** Overlay authority gates onto a total Files handler map. */
      readonly handlers: (handlers: Cmd.HandlerMap, options?: HandlerOptions) => Cmd.HandlerMap;
    };

    /** Actions checked by resolved authority. */
    export type Action = Files.Capability;

    /** Options for generated handler gates. */
    export type HandlerOptions = {
      /** Resolve the visible Files path/scope for a command payload. */
      readonly path?: PathResolver;
    };

    /** Resolve a visible Files path/scope for a command payload. */
    export type PathResolver = <K extends Cmd.Name>(args: PathResolverArgs<K>) =>
      | String.Path
      | undefined;

    /** Input passed to path resolvers. */
    export type PathResolverArgs<K extends Cmd.Name> = {
      readonly name: K;
      readonly payload: Cmd.Payload[K];
    };

    /** Error factories for authority checks. */
    export type ErrorFactories = {
      /** Invalid authored input or backing facts. */
      readonly invalid?: (message: string) => Error;
      /** Command/action is not supported by the backing. */
      readonly unsupported?: (action: Action) => Error;
      /** Policy denies the action for a path/scope. */
      readonly denied?: (action: Action, path: String.Path) => Error;
    };
  }

  /**
   * Source values accepted by text-ingesting Files backings.
   */
  export namespace Source {
    /** Text file source value without path/kind/size; those are derived by the backing. */
    export type TextFile = {
      /** Text content. */
      readonly content: string;
      /** Last modified time, Unix epoch milliseconds, when known. */
      readonly modifiedAt?: t.UnixTimestamp;
      /** Content hash, when known. */
      readonly hash?: t.StringHash;
      /** Media/content type, when known. */
      readonly mediaType?: t.StringMimeType;
    };

    /** Text file source shorthand or structured metadata. */
    export type TextFileInput = string | TextFile;
    /** Text file sources keyed by canonical root-relative Files path. */
    export type TextFileMap = { readonly [path: String.Path]: TextFileInput };

    /** Text-file source tree; empty directories must be explicit. */
    export type TextTree = {
      /** File content keyed by canonical root-relative Files path. */
      readonly files?: TextFileMap;
      /** Additional empty directories to expose; parent directories are derived. */
      readonly dirs?: readonly String.Path[];
    };
  }
}
